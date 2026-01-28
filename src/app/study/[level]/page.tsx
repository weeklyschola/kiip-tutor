"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useProgress } from "@/contexts/ProgressContext";
import { getLevelContent, getTopicsForLevel, getVocabularyByTopic, Vocabulary, HangulItem } from "@/data/levelContent";
import { useTTS } from "@/hooks/useTTS";
import Mascot from "@/components/Mascot";

type ProblemType = "listening_to_word" | "dialogue_completion" | "sentence_ordering" | "cloze_test";

interface Problem {
    id: string; // Unique ID used for SRS key
    type: ProblemType;
    question: string;
    correctAnswer: string;
    options: string[];
    audioText?: string;
    context?: { lines: { speaker: string; text: string; isBlank?: boolean }[] };
    exampleText?: string;
}

const topicIcons: Record<string, string> = {
    "학교": "🏫", "사물": "📦", "음식": "🍎", "가족": "👨‍👩‍👧‍👦",
    "장소": "📍", "동사": "🏃", "형용사": "✨", "시간": "⏰",
    "사회생활": "🤝", "인사말": "👋", "수업 표현": "📖"
};

// 컴포넌트 외부로 이동 (성능 최적화 및 렌더링 안정성)
const ClickableText = ({ text, onPlay, className = "" }: { text: string, onPlay: (t: string) => void, className?: string }) => {
    if (!text) return null;
    return (
        <span className={`${className} select-none`}>
            {text.split(" ").map((word, i) => (
                <span key={i} onClick={(e) => { e.stopPropagation(); onPlay(word); }} className="inline-block cursor-pointer hover:bg-blue-100 rounded px-0.5 mx-0.5 transition-colors">
                    {word}
                </span>
            ))}
        </span>
    );
};

const HangulCard = ({ item, onPlay }: { item: HangulItem, onPlay: (t: string) => void }) => {
    if (!item) return null;
    return (
        <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-lg border border-white/50 hover:shadow-xl transition-all group select-none">
            <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-5xl font-bold text-white shadow-lg cursor-pointer hover:scale-105 transition-transform" onClick={() => onPlay(item.name)}>
                    {item.character}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl font-bold text-slate-800">{item.name}</span>
                        <span className="text-slate-400 text-sm">[{item.romanization}]</span>
                    </div>
                    <p onClick={() => onPlay(item.exampleWord)} className="text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg text-sm cursor-pointer hover:bg-blue-100 transition-colors inline-flex items-center gap-2">
                        <span className="text-blue-400">🔊</span> {item.exampleWord} <span className="text-slate-400">({item.exampleMeaning})</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

// 메인 콘텐츠 컴포넌트 (useSearchParams 사용)
function LevelContent() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();

    // params.level이 undefined이거나 NaN일 경우 대비
    const levelParam = params?.level;
    const level = typeof levelParam === 'string' ? parseInt(levelParam) : 0;
    const isLevel0 = level === 0;

    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { canAccessLevel, updateLevelProgress, hasAiTutorAccess, progress, updateProblemResult, updateLastStudied } = useProgress();
    // AI Tutor Access 여부와 상관없이 베타 테스트/개발 중에는 항상 Premium(Google Cloud TTS)을 시도하도록 변경
    // Fallback이 있으므로 키가 없거나 실패해도 안전함.
    // AI Tutor Access 여부와 상관없이 베타 테스트/개발 중에는 항상 Premium(Google Cloud TTS)을 시도하도록 변경
    // Fallback이 있으므로 키가 없거나 실패해도 안전함.
    const { speak, stop } = useTTS({ isPremium: true });

    // 초기 모드를 'learning'으로 변경하여 인트로 없이 바로 시작
    const [mode, setMode] = useState<"intro" | "learning" | "quiz" | "result">("learning");

    // 기본 탭 설정: 레벨 0이면 한글, 아니면 단어장
    const [learningTab, setLearningTab] = useState<"hangul" | "vocab" | "dialogue">(isLevel0 ? "hangul" : "vocab");
    const [hangulSection, setHangulSection] = useState<"vowels" | "consonants" | "doubleVowels" | "doubleConsonants">("vowels");

    const initialTopic = searchParams?.get('topic');
    const [selectedTopic, setSelectedTopic] = useState<string | null>(initialTopic);

    const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [selectedWords, setSelectedWords] = useState<string[]>([]);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    const [hearts, setHearts] = useState(5);
    const [xp, setXp] = useState(0);
    const [streak, setStreak] = useState(0);
    const [problems, setProblems] = useState<Problem[]>([]);

    // 대화 모드 상태
    const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
    const [autoPlayDialogue, setAutoPlayDialogue] = useState(false);

    const contentRef = useRef<HTMLDivElement>(null);

    const content = getLevelContent(level);
    const topics = getTopicsForLevel(level) || []; // 안전장치
    const TOTAL_QUIZ_COUNT = 10;

    // 디버깅용 로그
    useEffect(() => {
        console.log(`[LevelPage] Level: ${level}, Mode: ${mode}, Tab: ${learningTab}`);
    }, [level, mode, learningTab]);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) { router.push("/signup"); return; }
        if (!authLoading && isAuthenticated && !canAccessLevel(level)) { router.push("/study"); }
    }, [authLoading, isAuthenticated, level, canAccessLevel, router]);

    // 대화 목록 (그룹화된 원본 사용)
    const dialogues = useMemo(() => content?.dialogues || [], [content]);

    // 현재 대화 (그룹 단위)
    const currentDialogue = dialogues[currentDialogueIndex] || null;

    // 공통 오디오 재생 함수
    const playAudio = (text: string, speaker?: string, onComplete?: () => void) => {
        if (!text) return;

        // 사용자가 직접 클릭해서 재생하는 경우, 진행 중인 자동 재생이 있으면 즉시 중단
        // (중단하지 않으면 기존 오디오가 멈추면서 onComplete가 트리거되어 다음 문장으로 넘어가는 현상 발생)
        if (autoPlayDialogue) {
            autoPlayRef.current = false; // 즉시 Ref 업데이트 (useEffect보다 빠름)
            setAutoPlayDialogue(false);
        }

        speak(text, speaker, onComplete);
    };

    // 대화 자동 진행 로직 (FIXED)
    const lineIndexRef = useRef(0);
    const autoPlayRef = useRef(autoPlayDialogue);

    useEffect(() => {
        autoPlayRef.current = autoPlayDialogue;
        if (!autoPlayDialogue) {
            // 정지되면 인덱스 유지 (원하면 리셋)
        } else {
            // 켜질 때 0으로 리셋하고 싶으면 여기서
            // lineIndexRef.current = 0; 
        }
    }, [autoPlayDialogue]);

    // 대화 자동 재생 (그룹 전체)
    useEffect(() => {
        if (learningTab === 'dialogue' && autoPlayDialogue && currentDialogue) {
            const lines = currentDialogue.lines;

            const playSequence = () => {
                if (!autoPlayRef.current) return;

                if (lineIndexRef.current >= lines.length) {
                    setAutoPlayDialogue(false);
                    lineIndexRef.current = 0;
                    return;
                }

                const line = lines[lineIndexRef.current];

                speak(line.korean, line.speaker, () => {
                    if (autoPlayRef.current) {
                        lineIndexRef.current += 1;
                        setTimeout(playSequence, 500);
                    }
                });
            };

            // isPlaying 체크 후 실행 (중복 방지)
            playSequence();
            // Note: speak 의존성 제거를 위해 useEffect 내부에서만 호출. 
            // 하지만 StrictMode에서 두번 호출될 수 있으니 주의.
            // 여기서는 심플하게 구현.

            return () => { autoPlayRef.current = false; };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [learningTab, autoPlayDialogue, currentDialogue]); // speak 제거

    useEffect(() => {
        if (contentRef.current) contentRef.current.scrollTop = 0;
    }, [currentProblemIndex, mode, selectedTopic, hangulSection]);

    // 탭 초기화 로직 보완
    useEffect(() => {
        if (mode === "learning") {
            if (isLevel0 && learningTab !== "hangul" && learningTab !== "vocab" && learningTab !== "dialogue") {
                setLearningTab("hangul");
            } else if (!isLevel0 && learningTab === "hangul") {
                setLearningTab("vocab");
            }
        }
    }, [mode, isLevel0, learningTab]);

    // Vocabulary Logic
    const [currentVocabIndex, setCurrentVocabIndex] = useState(0);
    const [showHidden, setShowHidden] = useState(false);

    // Progress Key for storing completed cards
    const vocabProgressKey = `study-vocab-${level}`;
    const cardProgress = progress.cardProgress?.[vocabProgressKey] || { completedCards: [] };

    // Filtered vocabulary list
    const filteredVocab = useMemo(() => {
        if (!content?.vocabulary) return [];
        const allVocab = content.vocabulary.map((v, idx) => ({ ...v, originalIndex: idx }));

        if (showHidden) return allVocab;
        return allVocab.filter(v => !cardProgress.completedCards.includes(v.originalIndex));
    }, [content, cardProgress.completedCards, showHidden]);

    const currentVocab = filteredVocab[currentVocabIndex];

    const { markCardCompleted, resetCardProgress } = useProgress();

    const handleMarkComplete = () => {
        if (!currentVocab) return;
        markCardCompleted(vocabProgressKey, currentVocab.originalIndex);
        // 완료 후 다음 카드로 자동 넘어가되, 마지막이면 유지하거나 처리
        if (currentVocabIndex >= filteredVocab.length - 1) {
            if (currentVocabIndex > 0) setCurrentVocabIndex(prev => prev - 1);
        }
        // 인덱스 조정 없음 (배열이 줄어들면서 현재 인덱스가 다음 단어를 가리킴)
    };

    // Reset index when filter changes
    useEffect(() => {
        setCurrentVocabIndex(0);
    }, [showHidden]);

    // 초기 토픽 설정 제거 (전체 보기)

    // Save last studied topic whenever it changes
    useEffect(() => {
        if (selectedTopic) {
            updateLastStudied(level, selectedTopic);
        }
    }, [selectedTopic, level, updateLastStudied]);

    const allProblems = useMemo(() => {
        if (!content) return [];
        const generated: Problem[] = [];
        const vocabList = content.vocabulary || [];
        const dialogueList = content.dialogues || [];

        vocabList.forEach((v, idx) => {
            if (!v) return;
            // Stable IDs using word
            if (v.examples && v.examples[0] && v.examples[0].includes(v.word)) {
                generated.push({
                    id: `cloze-${v.word.replace(/\s+/g, '-')}`,
                    type: "cloze_test",
                    question: "빈칸에 알맞은 말을 고르세요",
                    exampleText: v.examples[0].replace(v.word, "______"),
                    correctAnswer: v.word,
                    options: [...vocabList.filter(i => i.word !== v.word).map(i => i.word).sort(() => Math.random() - 0.5).slice(0, 3), v.word].sort(() => Math.random() - 0.5),
                    audioText: v.examples[0],
                });
            }
            generated.push({
                id: `lis-${v.word.replace(/\s+/g, '-')}`,
                type: "listening_to_word",
                question: "다음을 듣고 알맞은 단어를 고르세요",
                correctAnswer: v.word,
                options: [...vocabList.filter(i => i.word !== v.word).map(i => i.word).sort(() => Math.random() - 0.5).slice(0, 3), v.word].sort(() => Math.random() - 0.5),
                audioText: v.word,
            });
        });

        // Ensure dialogues exist before mapping
        if (dialogueList && dialogueList.length > 0) {
            dialogueList.forEach((d, dIdx) => {
                if (!d || !d.lines) return;
                // Use d.id if available, otherwise dIdx
                const dId = d.id !== undefined ? d.id : dIdx;
                d.lines.forEach((line, lIdx) => {
                    const allLines = dialogueList.flatMap(dial => (dial.lines || []).map(l => l.korean));
                    generated.push({
                        id: `dial-${dId}-${lIdx}`,
                        type: "dialogue_completion",
                        question: "대화를 완성하세요",
                        correctAnswer: line.korean,
                        options: [...allLines.filter(l => l !== line.korean && Math.abs(l.length - line.korean.length) < 15).sort(() => Math.random() - 0.5).slice(0, 3), line.korean].sort(() => Math.random() - 0.5),
                        audioText: d.lines.map(l => l.korean).join(". "),
                        context: { lines: d.lines.map((l, mapIdx) => ({ speaker: l.speaker, text: l.korean, isBlank: mapIdx === lIdx })) }
                    });
                    if (line.korean.split(" ").length >= 3) {
                        generated.push({
                            id: `ord-${dId}-${lIdx}`,
                            type: "sentence_ordering",
                            question: "문장을 올바른 순서로 만드세요",
                            correctAnswer: line.korean,
                            options: line.korean.split(" ").sort(() => Math.random() - 0.5),
                            audioText: line.korean
                        });
                    }
                });
            });
        }
        return generated;
    }, [content]);

    const selectWeightedProblems = () => {
        // Filter out problems that have simple parsing issues (redundant safety)
        let candidates = [...allProblems];

        // Calculate weights
        const weightedCandidates = candidates.map(p => {
            const stats = progress.problemStats?.[p.id];
            let weight = 1.0;
            if (stats) {
                // Incorrect answers increase weight significantly
                // Correct answers decrease weight
                // Base weight is 1
                weight = 1 + (stats.incorrect * 2) - (stats.correct * 0.5);
                if (weight < 0.1) weight = 0.1; // Minimum weight
            }
            return {
                problem: p,
                // Combine weight with random factor for sampling
                // Standard approach: -ln(U) / w where U is random(0,1) gives exponential distribution
                // Or simply: score = weight * random()
                score: weight * Math.random()
            };
        });

        // Sort by score descending and take top N
        return weightedCandidates.sort((a, b) => b.score - a.score).map(x => x.problem).slice(0, TOTAL_QUIZ_COUNT);
    };

    const startQuiz = () => {
        setProblems(selectWeightedProblems());
        setCurrentProblemIndex(0);
        setHearts(5);
        setXp(0);
        setStreak(0);
        setMode("quiz");
    };

    const checkAnswer = () => {
        const currentProblem = problems[currentProblemIndex];
        if (!currentProblem) return;
        let correct = currentProblem.type === 'sentence_ordering' ? selectedWords.join(" ") === currentProblem.correctAnswer : selectedOption === currentProblem.correctAnswer;
        setIsCorrect(correct); setShowFeedback(true);

        // Update SRS Stats
        if (currentProblem.id) {
            updateProblemResult(currentProblem.id, correct);
        }

        if (correct) { setStreak(prev => prev + 1); setXp(prev => prev + 10 + (streak > 2 ? 5 : 0)); playAudio("정답입니다"); }
        else { setStreak(0); setHearts(prev => Math.max(0, prev - 1)); playAudio("오답입니다"); }
    };

    const toggleWord = (word: string) => {
        if (showFeedback) return;
        setSelectedWords(prev => prev.includes(word) ? prev.filter(w => w !== word) : [...prev, word]);
        playAudio(word);
    };

    const nextProblem = () => {
        setShowFeedback(false); setSelectedOption(null); setSelectedWords([]);
        if (hearts <= 0) { alert("하트 소진!"); setMode("intro"); return; }
        if (currentProblemIndex < problems.length - 1) setCurrentProblemIndex(prev => prev + 1);
        else { updateLevelProgress(level, Math.min(100, Math.max(50, Math.round((xp / (problems.length * 10)) * 100)))); setMode("result"); }
    };

    if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 to-blue-200"><span className="text-xl text-blue-600">Loading Auth...</span></div>;

    // content 로딩 실패 또는 없음
    if (!content) return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 to-blue-200">
            <div className="text-center">
                <span className="text-xl text-red-500 block mb-2">Content Not Found</span>
                <Link href="/study" className="text-blue-600 underline">Back to List</Link>
            </div>
        </div>
    );

    // ==================== INTRO ====================
    if (mode === "intro") {
        return (
            <main className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100">
                <div className="max-w-lg mx-auto px-6 py-10 flex flex-col min-h-screen">
                    <Link href="/study" className="text-slate-400 hover:text-slate-600 text-2xl mb-6 w-fit">✕</Link>
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <div className="bg-white/60 backdrop-blur-md p-10 rounded-3xl shadow-xl border border-white/50 w-full">
                            <Mascot emotion="happy" size="lg" />
                            <h1 className="text-4xl font-extrabold text-slate-800 mt-6 mb-2">{level}단계</h1>
                            <p className="text-lg text-slate-500 mb-2 font-medium">{content.title}</p>
                            <p className="text-slate-400 mb-8">{content.description}</p>
                            <div className="flex flex-col gap-4">
                                <button onClick={() => setMode("learning")} className="w-full py-5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl font-bold text-xl flex items-center justify-center gap-3 shadow-lg hover:shadow-xl active:scale-[0.98] transition-all">
                                    <span>📖</span> 학습하기
                                </button>
                                <button onClick={startQuiz} className="w-full py-5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl font-bold text-xl flex items-center justify-center gap-3 shadow-lg hover:shadow-xl active:scale-[0.98] transition-all">
                                    <span>📝</span> 퀴즈 풀기
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    // ==================== LEARNING MODE ====================
    if (mode === "learning") {
        // Topic 필터링 (null이면 전체)
        const currentTopicVocab = selectedTopic
            ? getVocabularyByTopic(level, selectedTopic)
            : content.vocabulary || [];

        // Get Hangul data for Level 0
        const hangulData = {
            vowels: content.hangulVowels || [],
            consonants: content.hangulConsonants || [],
            doubleVowels: content.hangulDoubleVowels || [],
            doubleConsonants: content.hangulDoubleConsonants || [],
        };

        return (
            <main className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 pb-60">
                <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-white/50 shadow-sm">
                    <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
                        <button onClick={() => window.location.href = '/study'} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
                        <h1 className="font-bold text-lg text-slate-700">학습 모드</h1>
                        <div className="w-6"></div>
                    </div>
                </div>

                <div className="max-w-3xl mx-auto px-6 pt-6">
                    {/* Tab Switch - Level 0 has 3 tabs, others have 2 */}
                    <div className="flex bg-white/60 backdrop-blur rounded-2xl p-1.5 mb-6 shadow-md">
                        {isLevel0 && (
                            <button onClick={() => setLearningTab("hangul")} className={`flex-1 py-3 rounded-xl font-bold transition-all ${learningTab === "hangul" ? "bg-white shadow-lg text-blue-600" : "text-slate-500 hover:text-slate-700"}`}>🔤 한글</button>
                        )}
                        <button onClick={() => setLearningTab("vocab")} className={`flex-1 py-3 rounded-xl font-bold transition-all ${learningTab === "vocab" ? "bg-white shadow-lg text-blue-600" : "text-slate-500 hover:text-slate-700"}`}>📚 단어장</button>
                        <button onClick={() => setLearningTab("dialogue")} className={`flex-1 py-3 rounded-xl font-bold transition-all ${learningTab === "dialogue" ? "bg-white shadow-lg text-blue-600" : "text-slate-500 hover:text-slate-700"}`}>💬 대화</button>
                    </div>

                    {/* HANGUL TAB (Level 0 Only) */}
                    {learningTab === "hangul" && isLevel0 && (
                        <>
                            {/* Hangul Section Pills */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                <button onClick={() => setHangulSection("vowels")} className={`px-4 py-2 rounded-full font-semibold text-sm transition-all shadow-sm ${hangulSection === "vowels" ? 'bg-blue-500 text-white shadow-md' : 'bg-white/80 text-slate-600 hover:bg-white'}`}>
                                    ㅏㅓㅗㅜ 기본 모음
                                </button>
                                <button onClick={() => setHangulSection("consonants")} className={`px-4 py-2 rounded-full font-semibold text-sm transition-all shadow-sm ${hangulSection === "consonants" ? 'bg-blue-500 text-white shadow-md' : 'bg-white/80 text-slate-600 hover:bg-white'}`}>
                                    ㄱㄴㄷㄹ 기본 자음
                                </button>
                                <button onClick={() => setHangulSection("doubleVowels")} className={`px-4 py-2 rounded-full font-semibold text-sm transition-all shadow-sm ${hangulSection === "doubleVowels" ? 'bg-blue-500 text-white shadow-md' : 'bg-white/80 text-slate-600 hover:bg-white'}`}>
                                    ㅐㅔㅘ 이중 모음
                                </button>
                                <button onClick={() => setHangulSection("doubleConsonants")} className={`px-4 py-2 rounded-full font-semibold text-sm transition-all shadow-sm ${hangulSection === "doubleConsonants" ? 'bg-blue-500 text-white shadow-md' : 'bg-white/80 text-slate-600 hover:bg-white'}`}>
                                    ㄲㄸㅃ 쌍자음
                                </button>
                            </div>

                            {/* Hangul Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {hangulSection === "vowels" && hangulData.vowels.map((item, idx) => <HangulCard key={idx} item={item} onPlay={(t) => playAudio(t)} />)}
                                {hangulSection === "consonants" && hangulData.consonants.map((item, idx) => <HangulCard key={idx} item={item} onPlay={(t) => playAudio(t)} />)}
                                {hangulSection === "doubleVowels" && hangulData.doubleVowels.map((item, idx) => <HangulCard key={idx} item={item} onPlay={(t) => playAudio(t)} />)}
                                {hangulSection === "doubleConsonants" && hangulData.doubleConsonants.map((item, idx) => <HangulCard key={idx} item={item} onPlay={(t) => playAudio(t)} />)}
                            </div>
                        </>
                    )}

                    {/* VOCAB TAB (Flashcard Style) */}
                    {learningTab === "vocab" && (
                        <div className="flex flex-col items-center pb-32">
                            {/* Controls: Show Hidden & Reset */}
                            <div className="w-full flex justify-between items-center mb-6">
                                <div className="text-sm font-bold text-slate-500">
                                    {filteredVocab.length > 0 ? `${currentVocabIndex + 1} / ${filteredVocab.length}` : "0 / 0"}
                                    {showHidden && <span className="ml-2 text-blue-500">(전체 보기 중)</span>}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowHidden(!showHidden)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${showHidden ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                                    >
                                        {showHidden ? "숨긴 단어 끄기" : "완료된 단어 보기"}
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm("모든 암기 기록을 초기화하시겠습니까?")) {
                                                resetCardProgress(vocabProgressKey);
                                            }
                                        }}
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-white text-slate-400 hover:text-red-500 hover:border-red-200 transition-all"
                                    >
                                        초기화
                                    </button>
                                </div>
                            </div>

                            {/* Flashcard */}
                            {currentVocab ? (
                                <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-slate-100 min-h-[50vh] flex flex-col relative">
                                    {/* 상단 태그 영역 */}
                                    <div className="absolute top-4 left-4 flex gap-2 z-10">
                                        {currentVocab.topic && (
                                            <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-full">
                                                #{currentVocab.topic}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center mt-8">
                                        <button
                                            onClick={() => playAudio(currentVocab.word)}
                                            className="group relative"
                                        >
                                            <h2 className="text-4xl font-extrabold text-slate-800 mb-4 group-hover:scale-110 transition-transform">{currentVocab.word}</h2>
                                            <div className="absolute -right-8 -top-2 opacity-0 group-hover:opacity-100 transition-opacity text-2xl">🔊</div>
                                        </button>

                                        <div className="w-16 h-1 bg-slate-100 rounded-full my-6"></div>

                                        <p className="text-xl text-slate-600 font-medium mb-8">{currentVocab.meaning}</p>

                                        {/* 예문 */}
                                        <div className="w-full bg-blue-50 rounded-2xl p-5 text-left relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-400"></div>
                                            {currentVocab.examples && currentVocab.examples.map((ex, idx) => (
                                                <p key={idx} onClick={() => playAudio(ex)} className="text-slate-700 text-sm mb-2 last:mb-0 cursor-pointer hover:text-blue-600 transition-colors flex gap-2">
                                                    <span className="text-blue-400 shrink-0">A.</span> {ex}
                                                </p>
                                            ))}
                                            <div className="absolute bottom-2 right-3 text-blue-200 text-4xl opacity-50 font-serif">”</div>
                                        </div>
                                    </div>

                                    {/* 하단 액션 버튼 */}
                                    <div className="p-4 border-t border-slate-100 flex gap-3">
                                        <button
                                            onClick={handleMarkComplete}
                                            className="flex-1 py-3 bg-green-100 text-green-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-200 transition-colors"
                                        >
                                            ✅ 암기 완료
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-slate-50 rounded-3xl w-full border-2 border-dashed border-slate-200">
                                    <p className="text-slate-400 font-bold text-lg mb-2">학습할 단어가 없습니다!</p>
                                    <p className="text-slate-400 text-sm">모든 단어를 암기하셨네요 🎉</p>
                                    <button
                                        onClick={() => resetCardProgress(vocabProgressKey)}
                                        className="mt-6 px-6 py-2 bg-white border border-slate-200 rounded-full text-slate-500 font-bold hover:border-blue-300 hover:text-blue-500 transition-colors"
                                    >
                                        학습 기록 초기화
                                    </button>
                                </div>
                            )}

                            {/* 네비게이션 */}
                            <div className="flex gap-4 mt-8 w-full max-w-md">
                                <button
                                    onClick={() => {
                                        if (currentVocabIndex > 0) setCurrentVocabIndex(prev => prev - 1);
                                    }}
                                    disabled={currentVocabIndex === 0 || !currentVocab}
                                    className={`flex-1 py-4 rounded-2xl font-bold transition-all ${currentVocabIndex === 0 || !currentVocab ? "bg-slate-100 text-slate-300" : "bg-white text-slate-600 shadow-md hover:bg-slate-50"}`}
                                >
                                    ← 이전 카드
                                </button>
                                {currentVocabIndex < filteredVocab.length - 1 ? (
                                    <button
                                        onClick={() => setCurrentVocabIndex(prev => prev + 1)}
                                        className="flex-1 py-4 rounded-2xl font-bold transition-all bg-blue-600 text-white shadow-md hover:bg-blue-700"
                                    >
                                        다음 카드 →
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setCurrentVocabIndex(0)}
                                        className="flex-1 py-4 rounded-2xl font-bold transition-all bg-green-500 text-white shadow-md hover:bg-green-600"
                                    >
                                        🔄 처음으로
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* DIALOGUE TAB */}
                    {learningTab === "dialogue" && (
                        <div className="pb-32">
                            {/* 대화 컨트롤러 */}
                            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-sm mb-6 flex items-center justify-between sticky top-20 z-10 border border-blue-100">
                                <div className="text-sm font-bold text-slate-500">
                                    상황 {currentDialogueIndex + 1} / {dialogues.length}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            if (currentDialogueIndex > 0) setCurrentDialogueIndex(prev => prev - 1);
                                        }}
                                        disabled={currentDialogueIndex === 0}
                                        className={`px-3 py-2 rounded-lg font-bold text-sm transition-all ${currentDialogueIndex === 0 ? "text-slate-300" : "bg-white text-slate-600 shadow-sm hover:bg-slate-50"}`}
                                    >
                                        ← 이전
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (currentDialogueIndex < dialogues.length - 1) setCurrentDialogueIndex(prev => prev + 1);
                                        }}
                                        disabled={currentDialogueIndex === dialogues.length - 1}
                                        className={`px-3 py-2 rounded-lg font-bold text-sm transition-all ${currentDialogueIndex === dialogues.length - 1 ? "text-slate-300" : "bg-blue-600 text-white shadow-sm hover:bg-blue-700"}`}
                                    >
                                        다음 →
                                    </button>
                                </div>
                            </div>

                            {/* 통 대화 카드 뷰 */}
                            {currentDialogue ? (
                                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-slate-100 min-h-[50vh]">
                                    {/* 상단: 상황 제목 */}
                                    <div className="bg-slate-50 p-5 border-b border-slate-100 flex justify-between items-center">
                                        <h3 className="font-bold text-slate-700 text-lg">💬 {currentDialogue.situation}</h3>
                                        <button
                                            onClick={() => {
                                                const newState = !autoPlayDialogue;
                                                // 즉시 Ref 업데이트 및 동작 처리
                                                autoPlayRef.current = newState;

                                                if (newState) {
                                                    lineIndexRef.current = 0;
                                                    setAutoPlayDialogue(true);
                                                } else {
                                                    setAutoPlayDialogue(false);
                                                    stop(); // 즉시 오디오 정지
                                                }
                                            }}
                                            className={`px-5 py-3 rounded-full text-sm font-bold transition-all shadow-sm active:scale-95 flex items-center gap-2 ${autoPlayDialogue ? 'bg-green-500 text-white shadow-green-200' : 'bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            {autoPlayDialogue ? "⏹ 멈춤" : "▶ 전체 듣기"}
                                        </button>
                                    </div>

                                    {/* 대화 내용 (채팅창 스타일) */}
                                    <div className="p-6 space-y-6 bg-white pb-32">
                                        {currentDialogue.lines.map((line, lIdx) => {
                                            const isMinisu = line.speaker && line.speaker.includes("민수");
                                            const isTui = line.speaker && line.speaker.includes("투이");
                                            const isLeft = lIdx % 2 === 0;

                                            return (
                                                <div key={lIdx} className={`flex gap-3 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
                                                    {/* 화자 아바타 */}
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm flex-shrink-0 border-2 border-white ${isMinisu ? "bg-blue-100" : isTui ? "bg-pink-100" : "bg-slate-100"}`}>
                                                        {isMinisu ? "👨" : isTui ? "👩" : "👤"}
                                                    </div>

                                                    {/* 말풍선 */}
                                                    <div className={`flex flex-col max-w-[85%] ${isLeft ? 'items-start' : 'items-end'}`}>
                                                        <span className="text-xs text-slate-400 mb-1 mx-2">{line.speaker}</span>
                                                        <button
                                                            onClick={() => playAudio(line.korean, line.speaker)}
                                                            className={`p-5 rounded-3xl text-left transition-all active:scale-[0.98] shadow-sm
                                                                ${isLeft ? 'bg-slate-100 rounded-tl-none text-slate-800' : 'bg-blue-500 rounded-tr-none text-white shadow-blue-200'}`}
                                                        >
                                                            <p className="font-bold text-lg leading-relaxed">{line.korean}</p>
                                                            {line.english && <p className={`text-xs mt-2 font-medium ${isLeft ? 'text-slate-500' : 'text-blue-100'}`}>{line.english}</p>}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-20 text-slate-400">대화 내용이 없습니다.</div>
                            )}
                        </div>
                    )}
                </div>
                <div className="fixed bottom-0 w-full p-6 bg-gradient-to-t from-sky-100/90 via-sky-100/80 to-transparent">
                    <div className="max-w-3xl mx-auto">
                        <button onClick={startQuiz} className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl active:scale-[0.98] transition-all">학습 완료! 퀴즈 풀기</button>
                    </div>
                </div>
            </main>
        );
    }

    // ==================== RESULT ====================
    if (mode === "result") {
        return (
            <main className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white/80 backdrop-blur-md p-10 rounded-3xl shadow-xl border border-white/50 text-center">
                    <Mascot emotion="happy" size="lg" />
                    <h1 className="text-4xl font-extrabold text-slate-800 mt-6 mb-4">🎉 Quiz Clear!</h1>
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-gradient-to-br from-orange-100 to-amber-100 p-6 rounded-2xl border border-orange-200">
                            <p className="text-orange-600 font-bold mb-1">XP</p>
                            <p className="text-4xl font-extrabold text-orange-500">+{xp}</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-100 to-cyan-100 p-6 rounded-2xl border border-blue-200">
                            <p className="text-blue-600 font-bold mb-1">Streak</p>
                            <p className="text-4xl font-extrabold text-blue-500">{streak}</p>
                        </div>
                    </div>
                    <button onClick={() => router.push("/study")} className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl font-bold shadow-lg">목록으로</button>
                    <button onClick={startQuiz} className="w-full mt-4 py-4 bg-white text-slate-500 font-bold border-2 border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors">다시 도전하기</button>
                </div>
            </main>
        );
    }

    // ==================== QUIZ MODE ====================
    const currentProblem = problems[currentProblemIndex];
    if (!currentProblem) return null; // Safety check
    const quizProgress = currentProblemIndex + 1;

    return (
        <main className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 flex flex-col">
            <div className="px-6 py-4 flex items-center gap-4 max-w-2xl mx-auto w-full sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-white/50 shadow-sm">
                <button onClick={() => setMode("intro")} className="text-slate-400 hover:text-slate-600 text-2xl">✕</button>
                <div className="flex-1 bg-slate-200 h-4 rounded-full overflow-hidden relative shadow-inner">
                    <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500" style={{ width: `${(quizProgress / TOTAL_QUIZ_COUNT) * 100}%` }}></div>
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-500">{quizProgress} / {TOTAL_QUIZ_COUNT}</div>
                </div>
                <div className="flex items-center gap-1 text-red-500 font-bold text-lg"><span>❤️</span> {hearts}</div>
            </div>

            <div ref={contentRef} className="flex-1 px-6 max-w-2xl mx-auto w-full overflow-y-auto pb-44 pt-6">
                <div className="flex items-start gap-4 mb-8">
                    <Mascot emotion={showFeedback ? (isCorrect ? "happy" : "sad") : "neutral"} size="md" />
                    <div className="bg-white/80 backdrop-blur-sm border border-white/50 p-5 rounded-2xl rounded-tl-none shadow-lg w-full flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-700">{currentProblem.question}</h2>
                        {currentProblem.audioText && (
                            <button onClick={() => playAudio(currentProblem.audioText || "")} className="bg-blue-100 hover:bg-blue-200 text-blue-600 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ml-2 flex-shrink-0">🔊 전체 듣기</button>
                        )}
                    </div>
                </div>

                {currentProblem.type === 'sentence_ordering' && (
                    <div className="mb-8">
                        <div className="min-h-[60px] border-b-2 border-slate-200 mb-6 flex flex-wrap gap-2 items-center p-2">
                            {selectedWords.map((word, idx) => (<button key={`sel-${idx}`} onClick={() => toggleWord(word)} className="px-4 py-2 bg-white border border-blue-200 rounded-xl shadow-sm font-bold text-slate-700">{word}</button>))}
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {currentProblem.options.map((word, idx) => (<button key={idx} onClick={() => !selectedWords.includes(word) && toggleWord(word)} className={`px-5 py-3 rounded-xl font-bold shadow-md transition-all ${selectedWords.includes(word) ? 'bg-slate-200 text-transparent' : 'bg-white border border-slate-200 hover:border-blue-300 hover:shadow-lg'}`}>{word}</button>))}
                        </div>
                    </div>
                )}

                {currentProblem.type === 'cloze_test' && currentProblem.exampleText && (
                    <div className="mb-8 text-center">
                        <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-100 mb-8 shadow-md">
                            <h3 className="text-2xl font-bold text-slate-800 leading-relaxed"><ClickableText text={currentProblem.exampleText} onPlay={playAudio} /></h3>
                        </div>
                    </div>
                )}

                {currentProblem.type === 'dialogue_completion' && currentProblem.context && (
                    <div className="space-y-4 mb-8">
                        {currentProblem.context.lines.map((line, idx) => {
                            const isLeft = currentProblem?.context?.lines[0].speaker === line.speaker;
                            return (
                                <div key={idx} className={`flex ${isLeft ? 'justify-start' : 'justify-end'}`}>
                                    <div className="flex flex-col max-w-[85%]">
                                        <span className={`text-xs text-slate-400 mb-1 mx-1 ${isLeft ? 'text-left' : 'text-right'}`}>{line.speaker}</span>
                                        {line.isBlank ? (
                                            <div className={`p-4 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 font-medium ${selectedOption ? 'text-blue-600 border-blue-400 bg-blue-50' : ''}`}>{selectedOption || "______"}</div>
                                        ) : (
                                            <div className="flex items-end gap-2">
                                                {!isLeft && <button onClick={() => playAudio(line.text)} className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 hover:bg-blue-200 text-sm flex-shrink-0 mb-1">🔊</button>}
                                                <div className={`p-4 rounded-2xl ${isLeft ? 'bg-slate-100 text-slate-800 rounded-tl-none' : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-tr-none shadow-md'}`}>
                                                    <ClickableText text={line.text} onPlay={playAudio} className={isLeft ? "" : "text-white"} />
                                                </div>
                                                {isLeft && <button onClick={() => playAudio(line.text)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 text-sm flex-shrink-0 mb-1">🔊</button>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {currentProblem.type === 'listening_to_word' && (
                    <div className="flex flex-col items-center mb-8">
                        <button onClick={() => playAudio(currentProblem.audioText || "")} className={`w-32 h-32 rounded-3xl flex items-center justify-center text-5xl shadow-xl mb-8 transition-all ${isPlaying ? 'bg-blue-100 scale-95' : 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white active:scale-95'}`}>🔊</button>
                    </div>
                )}

                {currentProblem.type !== 'sentence_ordering' && (
                    <div className="grid grid-cols-1 gap-3">
                        {currentProblem.options.map((option, idx) => (
                            <div key={idx} onClick={() => !showFeedback && setSelectedOption(option)}
                                className={`relative flex items-center rounded-2xl border-2 shadow-md transition-all cursor-pointer bg-white/80 backdrop-blur-sm
                                    ${selectedOption === option ? 'border-blue-400 bg-blue-50' : 'border-white/50 hover:border-blue-200 hover:shadow-lg'} 
                                    ${showFeedback && option === currentProblem.correctAnswer && 'border-green-500 bg-green-50'} 
                                    ${showFeedback && selectedOption === option && !isCorrect && 'border-red-500 bg-red-50'}`}>
                                <div className={`flex-1 text-left px-5 py-4 font-bold text-lg ${selectedOption === option ? 'text-blue-600' : 'text-slate-700'} ${showFeedback && option === currentProblem.correctAnswer && 'text-green-700'}`}>
                                    <ClickableText text={option} onPlay={playAudio} />
                                </div>
                                <div className="border-l border-slate-100 py-2 px-3">
                                    <button onClick={(e) => { e.stopPropagation(); playAudio(option); }} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-blue-100 text-slate-400 hover:text-blue-500 transition-colors">🔊</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className={`fixed bottom-0 w-full p-6 border-t-2 transition-all z-20 ${showFeedback ? (isCorrect ? 'bg-green-100 border-green-200' : 'bg-red-100 border-red-200') : 'bg-white/80 backdrop-blur-md border-white/50'}`}>
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    {showFeedback && (<div className={`text-xl font-extrabold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '🎉 정답입니다!' : `정답: ${currentProblem.correctAnswer}`}</div>)}
                    <div className="flex-1"></div>
                    <button onClick={showFeedback ? nextProblem : checkAnswer} disabled={(currentProblem.type === 'sentence_ordering' ? selectedWords.length === 0 : !selectedOption) && !showFeedback}
                        className={`px-10 py-4 rounded-2xl font-bold text-lg shadow-lg transition-all ${(currentProblem.type === 'sentence_ordering' ? selectedWords.length === 0 : !selectedOption) && !showFeedback ? 'bg-slate-200 text-slate-400' : showFeedback ? (isCorrect ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' : 'bg-gradient-to-r from-red-500 to-rose-500 text-white') : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-xl'}`}>
                        {showFeedback ? '계속하기' : '확인'}
                    </button>
                </div>
            </div>
        </main>
    );
}

// Suspense Boundary 적용
export default function LevelDetailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 to-blue-200">
                <span className="text-xl text-blue-600 animate-pulse">Loading Study Materials...</span>
            </div>
        }>
            <LevelContent />
        </Suspense>
    );
}
