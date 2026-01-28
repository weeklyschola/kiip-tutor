import { useCallback, useEffect, useState, useRef } from 'react';

interface UseTTSOptions {
    isPremium?: boolean;
}

export const useTTS = (options: UseTTSOptions = {}) => {
    const { isPremium = false } = options;
    const [voicesReady, setVoicesReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    // Web Audio API Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // AudioContext 초기화 (싱글톤 패턴 권장하지만 여기선 훅 내 관리)
    useEffect(() => {
        if (typeof window !== 'undefined' && !audioContextRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                const ctx = new AudioContextClass();
                const gain = ctx.createGain();
                gain.gain.value = 2.5; // 볼륨 2.5배 증폭
                gain.connect(ctx.destination);

                audioContextRef.current = ctx;
                gainNodeRef.current = gain;
            }
        }

        return () => {
            if (audioContextRef.current?.state !== 'closed') {
                audioContextRef.current?.close();
            }
        };
    }, []);

    // 브라우저 TTS Voices 로드
    useEffect(() => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;

        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                setVoicesReady(true);
            }
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);

    // 재생 중단 (Web Audio & Web Speech 모두)
    const stopPrevious = useCallback(() => {
        // 1. Fetch 중단
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        // 2. Web Audio 중단
        if (sourceNodeRef.current) {
            try {
                sourceNodeRef.current.stop();
            } catch (e) {
                // 이미 정지된 경우 무시
            }
            sourceNodeRef.current.disconnect();
            sourceNodeRef.current = null;
        }

        // 3. Web Speech 중단
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    }, []);

    // 브라우저 기본 TTS (무료/Fallback)
    const speakWithWebSpeech = useCallback((text: string, onComplete?: () => void) => {
        if (typeof window === 'undefined' || !window.speechSynthesis) {
            onComplete?.();
            return;
        }

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ko-KR';
        utterance.rate = 1.0; // 속도 약간 올림

        utterance.onend = () => { setIsPlaying(false); onComplete?.(); };
        utterance.onerror = () => { setIsPlaying(false); onComplete?.(); };

        const voices = window.speechSynthesis.getVoices();
        // Google 한국어 보이스 우선, 없으면 일반 한국어
        const koreanVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('ko')) ||
            voices.find(v => v.lang.includes('ko') || v.lang.includes('KR'));

        if (koreanVoice) {
            utterance.voice = koreanVoice;
        }

        setIsPlaying(true);
        window.speechSynthesis.speak(utterance);
    }, []);

    // Gemini TTS (프리미엄 - Web Audio API 사용)
    const speakWithGemini = useCallback(async (text: string, speaker?: string, onComplete?: () => void): Promise<boolean> => {
        if (!audioContextRef.current || !gainNodeRef.current) return false;

        try {
            const ctx = audioContextRef.current;

            // iOS Safari Audio Unlock: 사용자 액션(클릭) 직후 resume 필요
            if (ctx.state === 'suspended') {
                await ctx.resume();
            }

            abortControllerRef.current = new AbortController();
            const timeoutId = setTimeout(() => abortControllerRef.current?.abort(), 10000);

            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, premium: true, speaker }),
                signal: abortControllerRef.current.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) return false;

            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

            // 소스 노드 생성 및 연결
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(gainNodeRef.current);
            sourceNodeRef.current = source;

            return new Promise((resolve) => {
                source.onended = () => {
                    setIsPlaying(false);
                    onComplete?.();
                    resolve(true); // 정상 완료
                };

                source.start(0);
                resolve(true); // 재생 시작 성공으로 간주
            });

        } catch (error) {
            if ((error as Error).name === 'AbortError') {
                return true; // 사용자 취소는 에러 아님
            }
            console.error("Gemini TTS Error:", error);
            return false;
        }
    }, []);

    // 말하기 실행
    const speak = useCallback(async (text: string, speaker?: string, onComplete?: () => void) => {
        // 재생 중이면 멈춤 (토글)
        if (isPlaying) {
            stopPrevious();
            setIsPlaying(false);
            return;
        }

        stopPrevious();
        setIsPlaying(true);

        // 오디오 컨텍스트가 없으면(서버사이드 등) 바로 Fallback
        if (!audioContextRef.current && typeof window !== 'undefined') {
            // 재시도: 컨텍스트 재생성 시도
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                const ctx = new AudioContextClass();
                const gain = ctx.createGain();
                gain.gain.value = 2.5;
                gain.connect(ctx.destination);
                audioContextRef.current = ctx;
                gainNodeRef.current = gain;
            }
        }

        // 프리미엄이고 컨텍스트 살아있으면 Gemini 시도
        if (isPremium && audioContextRef.current) {
            const success = await speakWithGemini(text, speaker, onComplete);
            if (success) return;
        }

        // 실패하거나 프리미엄 아니면 Web Speech Fallback
        speakWithWebSpeech(text, onComplete);
    }, [isPlaying, isPremium, speakWithGemini, speakWithWebSpeech, stopPrevious]);

    useEffect(() => {
        return () => {
            stopPrevious();
            setIsPlaying(false);
        };
    }, [stopPrevious]);

    return { speak, voicesReady, isPlaying, isPremium };
};
