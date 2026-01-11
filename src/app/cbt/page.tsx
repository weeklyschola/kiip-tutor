"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStudyHistory } from "@/hooks/useStudyHistory";
import DetailedExplanation from "@/components/DetailedExplanation";
import AiTutor from "@/components/AiTutor";
import { saveAttempt, getUserId } from "@/lib/supabase";
import ProgressBar from "@/components/ProgressBar";
import { useAuth } from "@/contexts/AuthContext";
import { useProgress } from "@/contexts/ProgressContext";

// 임시 문제 데이터
const sampleQuestions = [
    {
        id: 1,
        level: 3,
        question_text: "대한민국의 수도는 어디입니까?",
        options: ["부산", "서울", "대구", "인천"],
        correct_answer: 1,
        explanation: "대한민국의 수도는 서울입니다. 서울은 한강을 중심으로 발달한 도시입니다.",
        category: "한국 역사/문화"
    },
    {
        id: 2,
        level: 3,
        question_text: "다음 중 한글을 창제한 왕은 누구입니까?",
        options: ["태종", "세종대왕", "정조", "영조"],
        correct_answer: 1,
        explanation: "한글은 1443년 세종대왕이 창제하고 1446년에 반포하였습니다.",
        category: "한국 역사/문화"
    },
    {
        id: 3,
        level: 3,
        question_text: "한국의 명절 '추석'에 대한 설명으로 옳은 것은 무엇입니까?",
        options: [
            "추석에는 떡국을 먹으며 새해 인사를 합니다.",
            "햇곡식으로 송편을 빚어 조상에게 차례를 지냅니다.",
            "부모님께 세배를 드리고 세뱃돈을 받습니다.",
            "여름의 무더위를 이겨내기 위해 삼계탕을 먹습니다."
        ],
        correct_answer: 1,
        explanation: "추석은 음력 8월 15일로, 햇곡식으로 송편을 만들어 조상에게 차례를 지냅니다.",
        category: "문화유산"
    },
    {
        id: 4,
        level: 3,
        question_text: "다음 중 대한민국의 공휴일이 아닌 것은?",
        options: ["삼일절", "광복절", "어린이날", "추석 다음날"],
        correct_answer: 3,
        explanation: "삼일절(3.1), 광복절(8.15), 어린이날(5.5)은 공휴일입니다.",
        category: "한국 생활"
    },
    {
        id: 5,
        level: 3,
        question_text: "'안녕하세요'의 올바른 사용 시간대는?",
        options: ["아침에만", "저녁에만", "언제든지", "밤에만"],
        correct_answer: 2,
        explanation: "'안녕하세요'는 시간에 관계없이 언제든지 사용할 수 있는 인사말입니다.",
        category: "한국어"
    },
];

interface Answer {
    questionId: number;
    selectedAnswer: number;
    isCorrect: boolean;
    timeSpent: number;
}

export default function CbtPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading, user } = useAuth();
    const { hasCbtAccess, hasAiTutorAccess } = useProgress();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [timer, setTimer] = useState(0);
    const [questionStartTime, setQuestionStartTime] = useState(Date.now());
    const [isFinished, setIsFinished] = useState(false);
    const [expandedExplanation, setExpandedExplanation] = useState<number | null>(null);
    const [showAiTutor, setShowAiTutor] = useState(false);
    const [selectedWrongQuestion, setSelectedWrongQuestion] = useState<typeof sampleQuestions[0] | null>(null);
    const [selectedWrongAnswer, setSelectedWrongAnswer] = useState<number>(0);

    const hasCbt = hasCbtAccess();
    const hasAiTutor = hasAiTutorAccess();

    // 인증 및 CBT 접근 확인
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login");
            return;
        }
        if (!authLoading && isAuthenticated && !hasCbt) {
            router.push("/premium");
        }
    }, [authLoading, isAuthenticated, hasCbt, router]);

    const { saveSession } = useStudyHistory();
    const questions = sampleQuestions;
    const currentQuestion = questions[currentIndex];

    // 타이머
    useEffect(() => {
        if (isFinished) return;
        const interval = setInterval(() => {
            setTimer((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [isFinished]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return { mins, secs };
    };

    const handleSelectAnswer = (index: number) => {
        setSelectedAnswer(index);
    };

    const handleNext = useCallback(() => {
        if (selectedAnswer === null) return;

        const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
        const isCorrect = selectedAnswer === currentQuestion.correct_answer;

        const newAnswer: Answer = {
            questionId: currentQuestion.id,
            selectedAnswer,
            isCorrect,
            timeSpent,
        };

        setAnswers((prev) => [...prev, newAnswer]);

        if (currentIndex < questions.length - 1) {
            setCurrentIndex((prev) => prev + 1);
            setSelectedAnswer(null);
            setQuestionStartTime(Date.now());
        } else {
            setIsFinished(true);
        }
    }, [selectedAnswer, questionStartTime, currentQuestion, currentIndex, questions.length]);

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
            setSelectedAnswer(null);
        }
    };

    // 시험 완료 시 저장
    useEffect(() => {
        if (isFinished && answers.length > 0) {
            const wrongQuestions = answers
                .filter((a) => !a.isCorrect)
                .map((a) => {
                    const q = questions.find((q) => q.id === a.questionId)!;
                    return {
                        questionId: q.id,
                        questionText: q.question_text,
                        selectedAnswer: q.options[a.selectedAnswer],
                        correctAnswer: q.options[q.correct_answer],
                        category: q.category,
                    };
                });

            saveSession({
                level: 3,
                totalQuestions: questions.length,
                correctAnswers: answers.filter((a) => a.isCorrect).length,
                timeSpent: timer,
                wrongQuestions,
            });

            // 로그인한 사용자면 user.id 사용, 아니면 익명 ID 사용
            const userId = (isAuthenticated && user) ? user.id : getUserId();

            answers.forEach((answer) => {
                saveAttempt({
                    user_id: userId,
                    question_id: answer.questionId,
                    selected_answer: answer.selectedAnswer,
                    is_correct: answer.isCorrect,
                    time_spent: answer.timeSpent,
                });
            });
        }
    }, [isFinished, answers, questions, timer, saveSession]);

    const handleOpenAiTutor = (question: typeof sampleQuestions[0], answer: Answer) => {
        if (!hasAiTutor) {
            alert("AI 튜터 이용권을 구매해주세요.");
            return;
        }
        setSelectedWrongQuestion(question);
        setSelectedWrongAnswer(answer.selectedAnswer);
        setShowAiTutor(true);
    };

    const time = formatTime(timer);

    // 결과 화면
    if (isFinished) {
        const correctCount = answers.filter((a) => a.isCorrect).length;
        const wrongAnswers = answers.filter((a) => !a.isCorrect);

        return (
            <main className="min-h-screen bg-gray-50">
                {/* 헤더 */}
                <header className="bg-white sticky top-0 z-40 border-b border-gray-100">
                    <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
                        <Link href="/" className="text-gray-600">
                            <span className="text-xl">✕</span>
                        </Link>
                        <h1 className="font-bold text-gray-800">시험 결과</h1>
                        <div className="w-6" />
                    </div>
                </header>

                <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
                    {/* 결과 요약 */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm text-center">
                        <div className="text-6xl mb-4">
                            {correctCount === questions.length ? "🎉" : correctCount >= questions.length / 2 ? "👏" : "💪"}
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            {correctCount}/{questions.length} 정답
                        </h2>
                        <p className="text-gray-500 mb-6">
                            정답률 {Math.round((correctCount / questions.length) * 100)}% • 소요시간 {time.mins}분 {time.secs}초
                        </p>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-blue-50 rounded-xl p-4">
                                <div className="text-2xl font-bold text-blue-600">{correctCount}</div>
                                <div className="text-xs text-gray-500">정답</div>
                            </div>
                            <div className="bg-red-50 rounded-xl p-4">
                                <div className="text-2xl font-bold text-red-600">{wrongAnswers.length}</div>
                                <div className="text-xs text-gray-500">오답</div>
                            </div>
                            <div className="bg-purple-50 rounded-xl p-4">
                                <div className="text-2xl font-bold text-purple-600">{time.mins}:{time.secs.toString().padStart(2, '0')}</div>
                                <div className="text-xs text-gray-500">시간</div>
                            </div>
                        </div>
                    </section>

                    {/* 분석 페이지 링크 */}
                    <Link
                        href="/analytics"
                        className="block w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-center rounded-2xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg"
                    >
                        📈 상세 학습 분석 보기
                    </Link>

                    {/* 오답 분석 */}
                    {wrongAnswers.length > 0 && (
                        <section>
                            <h2 className="font-bold text-gray-800 mb-4">
                                ❌ 오답 분석 ({wrongAnswers.length}문제)
                            </h2>

                            <div className="space-y-4">
                                {wrongAnswers.map((answer) => {
                                    const question = questions.find((q) => q.id === answer.questionId)!;
                                    const isExpanded = expandedExplanation === answer.questionId;

                                    return (
                                        <div key={answer.questionId} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                                            <div className="p-4 border-b border-gray-100">
                                                <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full mb-2">
                                                    {question.category}
                                                </span>
                                                <p className="font-medium text-gray-800 mb-3">
                                                    {question.question_text}
                                                </p>
                                                <div className="flex items-center gap-3 text-sm">
                                                    <span className="text-red-600">❌ {question.options[answer.selectedAnswer]}</span>
                                                    <span className="text-gray-300">→</span>
                                                    <span className="text-green-600">✓ {question.options[question.correct_answer]}</span>
                                                </div>
                                            </div>

                                            <div className="p-4 space-y-2">
                                                <button
                                                    onClick={() => setExpandedExplanation(isExpanded ? null : answer.questionId)}
                                                    className="w-full py-2.5 bg-gray-50 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors text-sm"
                                                >
                                                    {isExpanded ? "📖 해설 접기" : "📖 상세 해설 보기"}
                                                </button>

                                                <button
                                                    onClick={() => handleOpenAiTutor(question, answer)}
                                                    className={`w-full py-2.5 rounded-xl font-medium text-sm transition-colors ${hasAiTutor
                                                        ? "bg-blue-600 text-white hover:bg-blue-700"
                                                        : "bg-gray-100 text-gray-400"
                                                        }`}
                                                >
                                                    {hasAiTutor ? "🤖 AI 튜터에게 질문" : "🔒 AI 튜터 (구매 필요)"}
                                                </button>
                                            </div>

                                            {isExpanded && (
                                                <div className="border-t border-gray-100">
                                                    <DetailedExplanation
                                                        question={question.question_text}
                                                        options={question.options}
                                                        selectedAnswer={answer.selectedAnswer}
                                                        correctAnswer={question.correct_answer}
                                                        explanation={question.explanation}
                                                        category={question.category}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* 버튼 */}
                    <div className="flex gap-3 pb-6">
                        <button
                            onClick={() => window.location.reload()}
                            className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-colors"
                        >
                            다시 풀기
                        </button>
                        <Link
                            href="/"
                            className="flex-1 py-4 bg-white text-gray-700 text-center rounded-2xl font-semibold border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                            홈으로
                        </Link>
                    </div>
                </div>

                {showAiTutor && selectedWrongQuestion && (
                    <AiTutor
                        question={selectedWrongQuestion.question_text}
                        selectedAnswer={selectedWrongQuestion.options[selectedWrongAnswer]}
                        correctAnswer={selectedWrongQuestion.options[selectedWrongQuestion.correct_answer]}
                        explanation={selectedWrongQuestion.explanation}
                        isPremium={hasAiTutor}
                        onClose={() => setShowAiTutor(false)}
                    />
                )}
            </main>
        );
    }

    // 시험 화면
    return (
        <main className="min-h-screen bg-gray-50 flex flex-col">
            {/* 헤더 */}
            <header className="bg-white sticky top-0 z-40 border-b border-gray-100">
                <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
                    <button onClick={() => window.history.back()} className="text-gray-600">
                        <span className="text-xl">✕</span>
                    </button>
                    <h1 className="font-bold text-gray-800">KIIP 3단계 모의고사</h1>
                    <button className="text-red-500 text-sm font-medium">
                        시험 종료
                    </button>
                </div>
            </header>

            <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6 flex flex-col">
                {/* 타이머 */}
                <div className="flex justify-center gap-4 mb-6">
                    <div className="text-center">
                        <div className="w-20 h-16 bg-gray-800 rounded-xl flex items-center justify-center">
                            <span className="text-3xl font-bold text-white font-mono">
                                {time.mins.toString().padStart(2, '0')}
                            </span>
                        </div>
                        <span className="text-xs text-gray-500 mt-1">분</span>
                    </div>
                    <div className="text-center">
                        <div className="w-20 h-16 bg-gray-100 rounded-xl flex items-center justify-center">
                            <span className="text-3xl font-bold text-gray-800 font-mono">
                                {time.secs.toString().padStart(2, '0')}
                            </span>
                        </div>
                        <span className="text-xs text-gray-500 mt-1">초</span>
                    </div>
                </div>

                {/* 진행률 */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-500">전체 진행률</span>
                        <span className="text-sm font-medium text-blue-600">
                            {currentIndex + 1} / {questions.length}
                        </span>
                    </div>
                    <ProgressBar value={((currentIndex + 1) / questions.length) * 100} size="md" />
                </div>

                {/* 문제 카드 */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm p-6 flex flex-col">
                    {/* 카테고리 태그 */}
                    <span className="inline-block self-start bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full mb-4">
                        {currentQuestion.category}
                    </span>

                    {/* 문제 번호 및 텍스트 */}
                    <div className="mb-6">
                        <span className="text-xs text-gray-400">문제 {currentIndex + 1}</span>
                        <h2 className="text-lg font-bold text-gray-800 mt-1 leading-relaxed">
                            {currentQuestion.question_text}
                        </h2>
                    </div>

                    {/* 보기 */}
                    <div className="flex-1 space-y-3">
                        {currentQuestion.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleSelectAnswer(index)}
                                className={`w-full p-4 text-left rounded-xl border-2 transition-all flex items-center gap-3 ${selectedAnswer === index
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                            >
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${selectedAnswer === index
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-100 text-gray-600"
                                    }`}>
                                    {index + 1}
                                </span>
                                <span className={`flex-1 ${selectedAnswer === index ? "text-blue-700" : "text-gray-700"}`}>
                                    {option}
                                </span>
                                {selectedAnswer === index && (
                                    <span className="text-blue-500">✓</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 하단 버튼 */}
                <div className="flex gap-3 mt-6 pb-4">
                    <button
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        className={`px-6 py-4 rounded-2xl font-medium flex items-center gap-2 ${currentIndex === 0
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                            }`}
                    >
                        ← 이전 문제
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={selectedAnswer === null}
                        className={`flex-1 py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 ${selectedAnswer !== null
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            }`}
                    >
                        {currentIndex < questions.length - 1 ? "다음 문제 →" : "결과 보기"}
                    </button>
                </div>
            </div>
        </main>
    );
}
