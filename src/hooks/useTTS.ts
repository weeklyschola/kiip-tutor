import { useCallback, useEffect, useState, useRef } from 'react';

interface UseTTSOptions {
    isPremium?: boolean;
}

export const useTTS = (options: UseTTSOptions = {}) => {
    const { isPremium = false } = options;
    const [voicesReady, setVoicesReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Preload voices on mount
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

    // 이전 재생 중단
    const stopPrevious = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    }, []);

    // 브라우저 기본 TTS (무료)
    const speakWithWebSpeech = useCallback((text: string) => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ko-KR';
        utterance.rate = 0.9;

        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);

        const voices = window.speechSynthesis.getVoices();
        const koreanVoice = voices.find(v => v.lang.includes('ko') || v.lang.includes('KR'));

        if (koreanVoice) {
            utterance.voice = koreanVoice;
        }

        setIsPlaying(true);
        window.speechSynthesis.speak(utterance);
    }, []);

    // Gemini TTS (프리미엄)
    const speakWithGemini = useCallback(async (text: string): Promise<boolean> => {
        try {
            abortControllerRef.current = new AbortController();
            const timeoutId = setTimeout(() => abortControllerRef.current?.abort(), 10000);

            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, premium: true }),
                signal: abortControllerRef.current.signal,
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const blob = await response.blob();
                const audio = new Audio(URL.createObjectURL(blob));
                audioRef.current = audio;

                audio.onended = () => setIsPlaying(false);
                audio.onerror = () => setIsPlaying(false);

                await audio.play();
                return true;
            }
            return false;
        } catch (error) {
            if ((error as Error).name === 'AbortError') {
                return true; // 정상 취소
            }
            return false;
        }
    }, []);

    const speak = useCallback(async (text: string) => {
        stopPrevious();
        setIsPlaying(true);

        // 프리미엄 사용자: Gemini TTS 시도 후 실패시 브라우저 TTS
        if (isPremium) {
            const success = await speakWithGemini(text);
            if (success) return;
        }

        // 무료 사용자 또는 프리미엄 실패시: 브라우저 TTS
        speakWithWebSpeech(text);
    }, [isPremium, speakWithGemini, speakWithWebSpeech, stopPrevious]);

    return { speak, voicesReady, isPlaying, isPremium };
};
