"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useProgress } from "@/contexts/ProgressContext";
import { allLevelContents, Vocabulary } from "@/data/levelContent";

interface QuizQuestion {
    word: string;
    correctMeaning: string;
    options: string[];
}

export default function QuizPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { hasLevelAccess } = useProgress();

    const [selectedLevel, setSelectedLevel] = useState<number>(0);
    const [quizStarted, setQuizStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [quizFinished, setQuizFinished] = useState(false);

    // 인증 체크
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/signup");
        }
    }, [authLoading, isAuthenticated, router]);

    // 레벨 선택 시 접근 권한 체크
    const handleLevelSelect = (level: number) => {
        if (!hasLevelAccess(level)) {
            router.push("/premium");
            return;
        }
        setSelectedLevel(level);
    };

    // 퀴즈 생성
    const generateQuiz = (level: number) => {
        const content = allLevelContents.find((c) => c.level === level);
        if (!content) return;

        const vocabulary = [...content.vocabulary];
        const shuffled = vocabulary.sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, Math.min(10, vocabulary.length));

        const quizQuestions: QuizQuestion[] = selected.map((v) => {
            // 오답 생성 (같은 레벨의 다른 단어들에서)
            const otherMeanings = vocabulary
                .filter((other) => other.meaning !== v.meaning)
                .map((other) => other.meaning)
                .sort(() => Math.random() - 0.5)
                .slice(0, 3);

            const options = [...otherMeanings, v.meaning].sort(() => Math.random() - 0.5);

            return {
                word: v.word,
                correctMeaning: v.meaning,
                options,
            };
        });

        setQuestions(quizQuestions);
        setQuizStarted(true);
        setCurrentQuestionIndex(0);
        setScore(0);
        setSelectedAnswer(null);
        setShowResult(false);
        setQuizFinished(false);
    };

    const handleSelectAnswer = (answer: string) => {
        if (showResult) return;

        setSelectedAnswer(answer);
        setShowResult(true);

        if (answer === questions[currentQuestionIndex].correctMeaning) {
            setScore((prev) => prev + 1);
        }
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
            setSelectedAnswer(null);
            setShowResult(false);
        } else {
            setQuizFinished(true);
        }
    };

    const handleRestartQuiz = () => {
        setQuizStarted(false);
        setQuizFinished(false);
    };

    if (authLoading) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </main>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <main className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500">
            {/* 헤더 */}
            <header className="bg-white/10 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/study" className="text-white hover:text-white/80">
                        ← 학습 목록
                    </Link>
                    <h1 className="font-bold text-white">🧠 단어장 퀴즈</h1>
                    <div className="w-20"></div>
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-4 py-8">
                {!quizStarted ? (
                    // 레벨 선택
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-4xl">🧠</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">단어장 암기 퀴즈</h2>
                            <p className="text-gray-600">학습할 단계를 선택하세요</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                            {allLevelContents.map((content) => {
                                const hasAccess = hasLevelAccess(content.level);
                                return (
                                    <button
                                        key={content.level}
                                        onClick={() => handleLevelSelect(content.level)}
                                        className={`p-4 rounded-xl border-2 transition-all relative ${selectedLevel === content.level
                                            ? "border-orange-500 bg-orange-50"
                                            : hasAccess
                                                ? "border-gray-200 hover:border-gray-300"
                                                : "border-gray-200 bg-gray-50 opacity-70"
                                            }`}
                                    >
                                        {!hasAccess && (
                                            <span className="absolute top-2 right-2 text-sm">🔒</span>
                                        )}
                                        <div className="text-2xl mb-2">
                                            {content.level === 0 ? "🌱" : content.level === 5 ? "🎓" : `📗`}
                                        </div>
                                        <div className="font-bold text-gray-800">{content.level}단계</div>
                                        <div className="text-xs text-gray-500">{content.vocabulary.length}개 단어</div>
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => generateQuiz(selectedLevel)}
                            className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold text-lg hover:from-orange-600 hover:to-red-600"
                        >
                            퀴즈 시작하기 →
                        </button>
                    </div>
                ) : quizFinished ? (
                    // 결과 화면
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-5xl">{score >= questions.length * 0.8 ? "🎉" : score >= questions.length * 0.5 ? "👍" : "💪"}</span>
                        </div>

                        <h2 className="text-3xl font-bold text-gray-800 mb-2">퀴즈 완료!</h2>
                        <p className="text-gray-600 mb-8">
                            {questions.length}문제 중 {score}개 정답
                        </p>

                        <div className="flex items-center justify-center gap-4 mb-8">
                            <div className="text-center p-6 bg-green-50 rounded-xl">
                                <div className="text-3xl font-bold text-green-600">{score}</div>
                                <div className="text-sm text-green-600">정답</div>
                            </div>
                            <div className="text-center p-6 bg-red-50 rounded-xl">
                                <div className="text-3xl font-bold text-red-600">{questions.length - score}</div>
                                <div className="text-sm text-red-600">오답</div>
                            </div>
                            <div className="text-center p-6 bg-blue-50 rounded-xl">
                                <div className="text-3xl font-bold text-blue-600">{Math.round((score / questions.length) * 100)}%</div>
                                <div className="text-sm text-blue-600">정답률</div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={handleRestartQuiz}
                                className="flex-1 py-4 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300"
                            >
                                다른 단계
                            </button>
                            <button
                                onClick={() => generateQuiz(selectedLevel)}
                                className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold hover:from-orange-600 hover:to-red-600"
                            >
                                다시 도전
                            </button>
                        </div>
                    </div>
                ) : (
                    // 퀴즈 진행
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        {/* 진행률 */}
                        <div className="mb-6">
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                                <span>진행률</span>
                                <span>{currentQuestionIndex + 1} / {questions.length}</span>
                            </div>
                            <div className="bg-gray-200 rounded-full h-2">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all"
                                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* 점수 */}
                        <div className="flex justify-center mb-6">
                            <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold">
                                ✓ {score}점
                            </div>
                        </div>

                        {/* 문제 */}
                        <div className="text-center mb-8">
                            <p className="text-gray-500 mb-2">이 단어의 뜻은?</p>
                            <h2 className="text-4xl font-bold text-gray-800">{currentQuestion.word}</h2>
                        </div>

                        {/* 보기 */}
                        <div className="space-y-3 mb-6">
                            {currentQuestion.options.map((option, index) => {
                                let buttonClass = "w-full p-4 rounded-xl border-2 text-left font-medium transition-all ";

                                if (showResult) {
                                    if (option === currentQuestion.correctMeaning) {
                                        buttonClass += "border-green-500 bg-green-50 text-green-700";
                                    } else if (option === selectedAnswer && option !== currentQuestion.correctMeaning) {
                                        buttonClass += "border-red-500 bg-red-50 text-red-700";
                                    } else {
                                        buttonClass += "border-gray-200 text-gray-400";
                                    }
                                } else {
                                    if (selectedAnswer === option) {
                                        buttonClass += "border-orange-500 bg-orange-50 text-orange-700";
                                    } else {
                                        buttonClass += "border-gray-200 hover:border-orange-300";
                                    }
                                }

                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleSelectAnswer(option)}
                                        disabled={showResult}
                                        className={buttonClass}
                                    >
                                        <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg mr-3 font-bold text-gray-600">
                                            {index + 1}
                                        </span>
                                        {option}
                                        {showResult && option === currentQuestion.correctMeaning && (
                                            <span className="float-right text-green-500">✓</span>
                                        )}
                                        {showResult && option === selectedAnswer && option !== currentQuestion.correctMeaning && (
                                            <span className="float-right text-red-500">✕</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* 다음 버튼 */}
                        {showResult && (
                            <button
                                onClick={handleNextQuestion}
                                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold text-lg hover:from-orange-600 hover:to-red-600"
                            >
                                {currentQuestionIndex < questions.length - 1 ? "다음 문제 →" : "결과 보기"}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
