"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useProgress } from "@/contexts/ProgressContext";
import { getLevelContent, getTopicsForLevel, getVocabularyByTopic, Vocabulary, HangulItem } from "@/data/levelContent";
import { useTTS } from "@/hooks/useTTS";
import Mascot from "@/components/Mascot";

type ProblemType = "listening_to_word" | "dialogue_completion" | "sentence_ordering" | "cloze_test";

interface Problem {
    id: string;
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

export default function LevelDetailPage() {
    const params = useParams();
    const router = useRouter();
    const level = parseInt(params.level as string);

    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { canAccessLevel, updateLevelProgress, hasAiTutorAccess } = useProgress();
    const { speak } = useTTS({ isPremium: hasAiTutorAccess() });

    const [mode, setMode] = useState<"intro" | "learning" | "quiz" | "result">("intro");
    // For level 0, we have 3 tabs: hangul, vocab, dialogue. Otherwise 2 tabs.
    const [learningTab, setLearningTab] = useState<"hangul" | "vocab" | "dialogue">("hangul");
    const [hangulSection, setHangulSection] = useState<"vowels" | "consonants" | "doubleVowels" | "doubleConsonants">("vowels");
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

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

    const contentRef = useRef<HTMLDivElement>(null);

    const content = getLevelContent(level);
    const topics = getTopicsForLevel(level);
    const TOTAL_QUIZ_COUNT = 10;

    const isLevel0 = level === 0;

    useEffect(() => {
        if (!authLoading && !isAuthenticated) { router.push("/signup"); return; }
        if (!authLoading && isAuthenticated && !canAccessLevel(level)) { router.push("/study"); }
    }, [authLoading, isAuthenticated, level, canAccessLevel, router]);

    useEffect(() => {
        if (contentRef.current) contentRef.current.scrollTop = 0;
    }, [currentProblemIndex, mode, selectedTopic, hangulSection]);

    useEffect(() => {
        if (mode === "learning") {
            if (isLevel0) {
                setLearningTab("hangul");
            } else {
                setLearningTab("vocab");
            }
        }
    }, [mode, isLevel0]);

    useEffect(() => {
        if (mode === "learning" && learningTab === "vocab" && topics.length > 0 && !selectedTopic) {
            setSelectedTopic(topics[0]);
        }
    }, [mode, learningTab, topics, selectedTopic]);

    const generateProblems = useMemo(() => {
        if (!content) return [];
        const generated: Problem[] = [];
        const vocabList = content.vocabulary;
        const dialogueList = content.dialogues;

        vocabList.forEach((v, idx) => {
            if (v.examples[0] && v.examples[0].includes(v.word)) {
                generated.push({
                    id: `cloze-${idx}`, type: "cloze_test", question: "빈칸에 알맞은 말을 고르세요",
                    exampleText: v.examples[0].replace(v.word, "______"), correctAnswer: v.word,
                    options: [...vocabList.filter(i => i.word !== v.word).map(i => i.word).sort(() => Math.random() - 0.5).slice(0, 3), v.word].sort(() => Math.random() - 0.5),
                    audioText: v.examples[0],
                });
            }
            generated.push({
                id: `lis-${idx}`, type: "listening_to_word", question: "다음을 듣고 알맞은 단어를 고르세요",
                correctAnswer: v.word,
                options: [...vocabList.filter(i => i.word !== v.word).map(i => i.word).sort(() => Math.random() - 0.5).slice(0, 3), v.word].sort(() => Math.random() - 0.5),
                audioText: v.word,
            });
        });

        dialogueList.forEach((d, dIdx) => {
            d.lines.forEach((line, lIdx) => {
                const allLines = dialogueList.flatMap(dial => dial.lines.map(l => l.korean));
                generated.push({
                    id: `dial-${dIdx}-${lIdx}`, type: "dialogue_completion", question: "대화를 완성하세요",
                    correctAnswer: line.korean,
                    options: [...allLines.filter(l => l !== line.korean && Math.abs(l.length - line.korean.length) < 15).sort(() => Math.random() - 0.5).slice(0, 3), line.korean].sort(() => Math.random() - 0.5),
                    audioText: d.lines.map(l => l.korean).join(". "),
                    context: { lines: d.lines.map((l, mapIdx) => ({ speaker: l.speaker, text: l.korean, isBlank: mapIdx === lIdx })) }
                });
                if (line.korean.split(" ").length >= 3) {
                    generated.push({
                        id: `ord-${dIdx}-${lIdx}`, type: "sentence_ordering", question: "문장을 올바른 순서로 만드세요",
                        correctAnswer: line.korean, options: line.korean.split(" ").sort(() => Math.random() - 0.5), audioText: line.korean
                    });
                }
            });
        });
        return generated.sort(() => Math.random() - 0.5).slice(0, TOTAL_QUIZ_COUNT);
    }, [content]);

    const startQuiz = () => { setProblems(generateProblems); setCurrentProblemIndex(0); setHearts(5); setXp(0); setStreak(0); setMode("quiz"); };
    const playAudio = (text: string) => { speak(text); setIsPlaying(true); setTimeout(() => setIsPlaying(false), 2000); };

    const checkAnswer = () => {
        const currentProblem = problems[currentProblemIndex];
        let correct = currentProblem.type === 'sentence_ordering' ? selectedWords.join(" ") === currentProblem.correctAnswer : selectedOption === currentProblem.correctAnswer;
        setIsCorrect(correct); setShowFeedback(true);
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

    if (!content || authLoading) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 to-blue-200"><span className="text-xl text-blue-600">Loading...</span></div>;

    const ClickableText = ({ text, className = "" }: { text: string, className?: string }) => (
        <span className={className}>{text.split(" ").map((word, i) => (<span key={i} onClick={(e) => { e.stopPropagation(); playAudio(word); }} className="inline-block cursor-pointer hover:bg-blue-100 rounded px-0.5 mx-0.5 transition-colors">{word}</span>))}</span>
    );

    // Hangul Card Component
    const HangulCard = ({ item }: { item: HangulItem }) => (
        <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-lg border border-white/50 hover:shadow-xl transition-all group">
            <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-5xl font-bold text-white shadow-lg cursor-pointer hover:scale-105 transition-transform" onClick={() => playAudio(item.name)}>
                    {item.character}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl font-bold text-slate-800">{item.name}</span>
                        <span className="text-slate-400 text-sm">[{item.romanization}]</span>
                    </div>
                    <p onClick={() => playAudio(item.exampleWord)} className="text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg text-sm cursor-pointer hover:bg-blue-100 transition-colors inline-flex items-center gap-2">
                        <span className="text-blue-400">🔊</span> {item.exampleWord} <span className="text-slate-400">({item.exampleMeaning})</span>
                    </p>
                </div>
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
        const currentTopicVocab = selectedTopic ? getVocabularyByTopic(level, selectedTopic) : [];

        // Get Hangul data for Level 0
        const hangulData = {
            vowels: content.hangulVowels || [],
            consonants: content.hangulConsonants || [],
            doubleVowels: content.hangulDoubleVowels || [],
            doubleConsonants: content.hangulDoubleConsonants || [],
        };

        return (
            <main className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 pb-28">
                <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-white/50 shadow-sm">
                    <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
                        <button onClick={() => setMode("intro")} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
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
                                {hangulSection === "vowels" && hangulData.vowels.map((item, idx) => <HangulCard key={idx} item={item} />)}
                                {hangulSection === "consonants" && hangulData.consonants.map((item, idx) => <HangulCard key={idx} item={item} />)}
                                {hangulSection === "doubleVowels" && hangulData.doubleVowels.map((item, idx) => <HangulCard key={idx} item={item} />)}
                                {hangulSection === "doubleConsonants" && hangulData.doubleConsonants.map((item, idx) => <HangulCard key={idx} item={item} />)}
                            </div>
                        </>
                    )}

                    {/* VOCAB TAB */}
                    {learningTab === "vocab" && (
                        <>
                            <div className="flex flex-wrap gap-2 mb-6">
                                {topics.map(topic => (
                                    <button key={topic} onClick={() => setSelectedTopic(topic)}
                                        className={`px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-1.5 transition-all shadow-sm
                                            ${selectedTopic === topic ? 'bg-blue-500 text-white shadow-md scale-105' : 'bg-white/80 text-slate-600 hover:bg-white hover:shadow-md'}`}>
                                        <span>{topicIcons[topic] || "📌"}</span> {topic}
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {currentTopicVocab.map((v, idx) => (
                                    <div key={idx} className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 group hover:shadow-xl transition-all">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-2xl font-bold text-slate-800 mb-1">{v.word}</h3>
                                                <p className="text-slate-500 text-sm mb-3">{v.meaning}</p>
                                                <div className="space-y-2">
                                                    {v.examples.map((ex, exIdx) => (
                                                        <p key={exIdx} onClick={() => playAudio(ex)} className="text-blue-600 text-sm bg-blue-50 px-3 py-2 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors flex items-center gap-2">
                                                            <span className="text-blue-400 text-xs">🔊</span> {ex}
                                                        </p>
                                                    ))}
                                                </div>
                                            </div>
                                            <button onClick={() => playAudio(v.word)} className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center text-2xl hover:from-blue-200 hover:to-cyan-200 transition-colors flex-shrink-0 shadow-md">🔊</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* DIALOGUE TAB */}
                    {learningTab === "dialogue" && (
                        <div className="space-y-6">
                            {content.dialogues.map((d, dIdx) => (
                                <div key={dIdx} className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50">
                                    <h3 className="font-bold text-lg text-slate-700 mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
                                        <span>💬 {d.situation}</span>
                                        <button onClick={() => playAudio(d.lines.map(l => l.korean).join(" "))} className="text-sm bg-blue-100 text-blue-600 px-4 py-1.5 rounded-full font-medium hover:bg-blue-200 transition-colors">🔊 전체 듣기</button>
                                    </h3>
                                    <div className="space-y-4">
                                        {d.lines.map((line, lIdx) => {
                                            const isLeft = d.lines[0].speaker === line.speaker;
                                            return (
                                                <div key={lIdx} className={`flex ${isLeft ? 'justify-start' : 'justify-end'}`}>
                                                    <div className="flex items-end gap-2 max-w-[85%]">
                                                        {!isLeft && <button onClick={() => playAudio(line.korean)} className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 hover:bg-blue-200 text-sm flex-shrink-0 mb-1">🔊</button>}
                                                        <div className={`p-4 rounded-2xl cursor-pointer hover:opacity-90 transition-opacity ${isLeft ? 'bg-slate-100 text-slate-800 rounded-tl-none' : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-tr-none shadow-md'}`} onClick={() => playAudio(line.korean)}>
                                                            <p className={`text-xs mb-1 ${isLeft ? 'text-slate-400' : 'text-blue-100'}`}>{line.speaker}</p>
                                                            <p className="font-medium text-lg">{line.korean}</p>
                                                        </div>
                                                        {isLeft && <button onClick={() => playAudio(line.korean)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 text-sm flex-shrink-0 mb-1">🔊</button>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
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
                            <h3 className="text-2xl font-bold text-slate-800 leading-relaxed"><ClickableText text={currentProblem.exampleText} /></h3>
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
                                                    <ClickableText text={line.text} className={isLeft ? "" : "text-white"} />
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
                                    <ClickableText text={option} />
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
