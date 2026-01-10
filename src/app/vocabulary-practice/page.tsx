"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useTTS } from "@/hooks/useTTS";
import { useAuth } from "@/contexts/AuthContext";
import { useProgress } from "@/contexts/ProgressContext";
import SubscriptionModal from "@/components/SubscriptionModal";

// JSON 파일에서 단어 데이터 import
import level0Data from "@/data/vocabulary/level0.json";
import level1Data from "@/data/vocabulary/level1.json";
import level2Data from "@/data/vocabulary/level2.json";
import level3Data from "@/data/vocabulary/level3.json";
import level4Data from "@/data/vocabulary/level4.json";
import level5Data from "@/data/vocabulary/level5.json";

// 대화 데이터 import
import { levelContents } from "@/data/levelContent";

// 타입 정의
interface VocabularyWord {
    word: string;
    meaning: string;
    pronunciation: string;
    topic: string;
    examples: string[];
}

// 문제 유형
type QuestionType =
    | "dialogueComplete"   // 대화 완성
    | "situationSentence"  // 상황별 문장 선택
    | "situationQuestion"  // 상황별 질문하기
    | "listening"          // 듣기 문제
    | "particle"           // 조사 맞추기
    | "ending"             // 어미 맞추기
    | "sentenceOrder"      // 문장 순서 구성 (레벨 2+)
    | "wordTyping";        // 단어 타이핑 (레벨 3+)

interface Question {
    type: QuestionType;
    prompt: string;
    correctAnswer: string;
    options?: string[];        // 선택형 문제용
    audioText?: string;        // 듣기용
    sentence?: string;         // 문장 (빈칸용)
    context?: string;          // 상황 설명
    words?: string[];          // 문장 순서용 단어들
    hint?: string;             // 힌트
}

// 레벨별 데이터 매핑
const vocabularyData: Record<number, { vocabulary: VocabularyWord[] }> = {
    0: level0Data as { vocabulary: VocabularyWord[] },
    1: level1Data as { vocabulary: VocabularyWord[] },
    2: level2Data as { vocabulary: VocabularyWord[] },
    3: level3Data as { vocabulary: VocabularyWord[] },
    4: level4Data as { vocabulary: VocabularyWord[] },
    5: level5Data as { vocabulary: VocabularyWord[] },
};

// 대화 완성 문제 데이터
const dialogueTemplates = [
    {
        context: "처음 만난 사람에게 인사할 때",
        a: "안녕하세요?",
        blank: "B의 대답",
        correct: "네, 안녕하세요.",
        options: ["네, 안녕하세요.", "잘 먹겠습니다.", "안녕히 가세요.", "죄송합니다."]
    },
    {
        context: "선생님께 감사 인사를 할 때",
        a: "오늘 수업 감사합니다.",
        blank: "선생님의 대답",
        correct: "네, 수고했어요.",
        options: ["네, 수고했어요.", "안녕하세요.", "잘 먹었습니다.", "실례합니다."]
    },
    {
        context: "식당에서 음식을 주문할 때",
        a: "어서 오세요. 뭐 드릴까요?",
        blank: "손님의 대답",
        correct: "비빔밥 하나 주세요.",
        options: ["비빔밥 하나 주세요.", "안녕히 가세요.", "감사합니다.", "잘 먹었습니다."]
    },
    {
        context: "길을 물어볼 때",
        a: "실례합니다. 은행이 어디에 있어요?",
        blank: "상대방의 대답",
        correct: "저기 병원 옆에 있어요.",
        options: ["저기 병원 옆에 있어요.", "잘 먹겠습니다.", "안녕하세요.", "감사합니다."]
    },
    {
        context: "헤어질 때 인사",
        a: "저 먼저 갈게요.",
        blank: "남는 사람의 대답",
        correct: "네, 안녕히 가세요.",
        options: ["네, 안녕히 가세요.", "안녕히 계세요.", "잘 먹겠습니다.", "실례합니다."]
    },
    {
        context: "수업 시간에 질문할 때",
        a: "선생님, 질문 있어요.",
        blank: "선생님의 대답",
        correct: "네, 말해 보세요.",
        options: ["네, 말해 보세요.", "잘 먹겠습니다.", "안녕히 가세요.", "어서 오세요."]
    },
    {
        context: "식사 전 인사",
        a: "맛있게 드세요.",
        blank: "대답",
        correct: "네, 잘 먹겠습니다.",
        options: ["네, 잘 먹겠습니다.", "안녕히 가세요.", "죄송합니다.", "어서 오세요."]
    },
    {
        context: "늦었을 때 사과",
        a: "왜 이렇게 늦었어요?",
        blank: "대답",
        correct: "죄송합니다. 늦어서 죄송합니다.",
        options: ["죄송합니다. 늦어서 죄송합니다.", "잘 먹겠습니다.", "안녕하세요.", "감사합니다."]
    },
];

// 상황별 문장 선택 데이터
const situationTemplates = [
    {
        situation: "가게에서 물건 가격을 물어보려고 합니다.",
        correct: "이거 얼마예요?",
        options: ["이거 얼마예요?", "안녕히 가세요.", "잘 먹겠습니다.", "저는 학생이에요."]
    },
    {
        situation: "처음 만난 사람에게 자기 소개를 하려고 합니다.",
        correct: "만나서 반갑습니다.",
        options: ["만나서 반갑습니다.", "잘 먹었습니다.", "안녕히 계세요.", "죄송합니다."]
    },
    {
        situation: "병원에서 의사에게 통증을 설명하려고 합니다.",
        correct: "머리가 아파요.",
        options: ["머리가 아파요.", "잘 먹겠습니다.", "안녕하세요.", "이거 주세요."]
    },
    {
        situation: "버스에서 내리려고 합니다.",
        correct: "잠깐만요, 내릴게요.",
        options: ["잠깐만요, 내릴게요.", "안녕하세요.", "감사합니다.", "잘 먹겠습니다."]
    },
    {
        situation: "친구에게 주말 계획을 물어보려고 합니다.",
        correct: "주말에 뭐 해요?",
        options: ["주말에 뭐 해요?", "잘 먹었습니다.", "안녕히 가세요.", "죄송합니다."]
    },
    {
        situation: "도서관에서 책을 빌리려고 합니다.",
        correct: "이 책 빌릴 수 있어요?",
        options: ["이 책 빌릴 수 있어요?", "잘 먹겠습니다.", "안녕하세요.", "죄송합니다."]
    },
    {
        situation: "택시에서 목적지를 말하려고 합니다.",
        correct: "서울역으로 가 주세요.",
        options: ["서울역으로 가 주세요.", "안녕하세요.", "감사합니다.", "잘 먹겠습니다."]
    },
    {
        situation: "카페에서 음료를 주문하려고 합니다.",
        correct: "아메리카노 한 잔 주세요.",
        options: ["아메리카노 한 잔 주세요.", "안녕히 가세요.", "잘 먹었습니다.", "죄송합니다."]
    },
];

// 상황별 질문하기 데이터
const questionTemplates = [
    {
        situation: "상대방의 이름을 알고 싶을 때",
        correct: "이름이 뭐예요?",
        options: ["이름이 뭐예요?", "어디 가요?", "뭐 먹어요?", "몇 시예요?"]
    },
    {
        situation: "장소를 찾을 때",
        correct: "화장실이 어디예요?",
        options: ["화장실이 어디예요?", "이름이 뭐예요?", "뭐 해요?", "언제 와요?"]
    },
    {
        situation: "시간을 알고 싶을 때",
        correct: "지금 몇 시예요?",
        options: ["지금 몇 시예요?", "어디예요?", "뭐예요?", "누구예요?"]
    },
    {
        situation: "상대방의 직업을 물어볼 때",
        correct: "직업이 뭐예요?",
        options: ["직업이 뭐예요?", "어디 가요?", "몇 시예요?", "뭐 먹어요?"]
    },
    {
        situation: "상대방의 국적을 물어볼 때",
        correct: "어느 나라 사람이에요?",
        options: ["어느 나라 사람이에요?", "이름이 뭐예요?", "뭐 해요?", "어디예요?"]
    },
    {
        situation: "전화번호를 물어볼 때",
        correct: "전화번호가 뭐예요?",
        options: ["전화번호가 뭐예요?", "어디 가요?", "몇 시예요?", "뭐 먹어요?"]
    },
    {
        situation: "날짜를 물어볼 때",
        correct: "오늘 며칠이에요?",
        options: ["오늘 며칠이에요?", "어디예요?", "누구예요?", "뭐예요?"]
    },
    {
        situation: "가격을 물어볼 때",
        correct: "이거 얼마예요?",
        options: ["이거 얼마예요?", "어디 가요?", "몇 시예요?", "이름이 뭐예요?"]
    },
];

// 조사 문제용 문장 템플릿
const particleTemplates = [
    { template: "학교___ 가요.", correct: "에", options: ["에", "을", "이", "는"] },
    { template: "도서관___ 공부해요.", correct: "에서", options: ["에서", "에", "을", "는"] },
    { template: "밥___ 먹어요.", correct: "을", options: ["을", "에", "이", "는"] },
    { template: "커피___ 마셔요.", correct: "를", options: ["를", "을", "가", "에"] },
    { template: "날씨___ 좋아요.", correct: "가", options: ["가", "을", "에", "는"] },
    { template: "저___ 학생이에요.", correct: "는", options: ["는", "을", "에", "이"] },
    { template: "책___ 있어요.", correct: "이", options: ["이", "가", "을", "에"] },
    { template: "친구___ 왔어요.", correct: "가", options: ["가", "이", "을", "는"] },
    { template: "버스___ 가요.", correct: "로", options: ["로", "을", "에", "가"] },
    { template: "한국어___ 말해요.", correct: "로", options: ["로", "을", "가", "에"] },
    { template: "시장___ 채소를 사요.", correct: "에서", options: ["에서", "에", "을", "로"] },
    { template: "영화___ 봐요.", correct: "를", options: ["를", "을", "이", "에"] },
];

// 어미 문제용 문장 템플릿  
const endingTemplates = [
    { template: "밥을 먹___.", correct: "어요", options: ["어요", "아요", "해요", "습니다"], hint: "먹다" },
    { template: "학교에 가___.", correct: "요", options: ["요", "어요", "해요", "습니다"], hint: "가다" },
    { template: "한국어를 공부___.", correct: "해요", options: ["해요", "아요", "어요", "습니다"], hint: "공부하다" },
    { template: "책을 읽___.", correct: "어요", options: ["어요", "아요", "해요", "습니다"], hint: "읽다" },
    { template: "커피를 마___.", correct: "셔요", options: ["셔요", "아요", "어요", "해요"], hint: "마시다" },
    { template: "영화를 ___.", correct: "봐요", options: ["봐요", "보어요", "보습니다", "본다"], hint: "보다" },
    { template: "친구를 만___.", correct: "나요", options: ["나요", "나어요", "나해요", "납니다"], hint: "만나다" },
    { template: "운동을 ___.", correct: "해요", options: ["해요", "하요", "어요", "습니다"], hint: "하다" },
    { template: "집에서 쉬___.", correct: "어요", options: ["어요", "아요", "해요", "습니다"], hint: "쉬다" },
];

// 문장 순서 구성 데이터 (레벨 2+)
const sentenceOrderTemplates = [
    { words: ["저는", "학생", "이에요"], correct: "저는 학생 이에요", hint: "자기소개" },
    { words: ["학교에", "버스로", "가요"], correct: "버스로 학교에 가요", hint: "교통수단" },
    { words: ["맛있어요", "이", "음식", "정말"], correct: "이 음식 정말 맛있어요", hint: "음식 칭찬" },
    { words: ["어디에", "은행이", "있어요"], correct: "은행이 어디에 있어요", hint: "장소 질문" },
    { words: ["한국어를", "열심히", "공부해요"], correct: "한국어를 열심히 공부해요", hint: "공부" },
    { words: ["지금", "시예요", "몇"], correct: "지금 몇 시예요", hint: "시간 질문" },
    { words: ["주말에", "뭐", "해요"], correct: "주말에 뭐 해요", hint: "계획 질문" },
    { words: ["친구하고", "영화를", "봐요"], correct: "친구하고 영화를 봐요", hint: "여가 활동" },
];

// 단어 타이핑 데이터 (레벨 3+)
const typingTemplates = [
    { sentence: "저는 ___이에요.", hint: "직업 (예: 학생, 회사원)", answers: ["학생", "회사원", "선생님", "의사"] },
    { sentence: "오늘 날씨가 ___.", hint: "날씨 표현 (예: 좋아요)", answers: ["좋아요", "나빠요", "추워요", "더워요"] },
    { sentence: "___ 잘 먹겠습니다.", hint: "식사 전 인사", answers: ["네", "감사합니다"] },
    { sentence: "만나서 ___.", hint: "첫 인사", answers: ["반갑습니다", "반가워요"] },
    { sentence: "이거 ___ 주세요.", hint: "가격 질문", answers: ["얼마에", "얼마예요"] },
];

type ViewMode = "select" | "practice" | "result";

export default function VocabularyPracticePage() {
    const { hasAiTutorAccess } = useProgress();
    const { isAuthenticated } = useAuth(); // 로그인 여부 확인
    const { speak } = useTTS({ isPremium: hasAiTutorAccess() });
    const isPremium = hasAiTutorAccess(); // 프리미엄 여부

    // 게임 상태
    const [viewMode, setViewMode] = useState<ViewMode>("select");
    const [selectedLevel, setSelectedLevel] = useState<number>(0);
    const [hearts, setHearts] = useState(5);
    const [xp, setXp] = useState(0);
    const [streak, setStreak] = useState(0);

    // 유료 기능 안내 모달
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // 문제 상태
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [typedAnswer, setTypedAnswer] = useState("");
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);

    // 문장 순서 상태
    const [selectedWords, setSelectedWords] = useState<string[]>([]);
    const [availableWords, setAvailableWords] = useState<string[]>([]);

    // 결과 통계
    const [correctCount, setCorrectCount] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(0);

    // 레벨별 단어 수 계산
    const levelWordCounts = useMemo(() => {
        return Object.entries(vocabularyData).map(([level, data]) => ({
            level: parseInt(level),
            count: data.vocabulary?.length || 0
        }));
    }, []);

    // 문제 생성 함수
    const generateQuestions = useCallback((level: number) => {
        const generatedQuestions: Question[] = [];

        // 기본 문제 유형 (모든 레벨)
        const basicTypes: QuestionType[] = ["dialogueComplete", "situationSentence", "situationQuestion", "listening", "particle", "ending"];

        // 레벨 2+ 추가: 문장 순서
        if (level >= 2) {
            basicTypes.push("sentenceOrder");
        }

        // 레벨 3+ 추가: 단어 타이핑
        if (level >= 3) {
            basicTypes.push("wordTyping");
        }

        // 10문제 생성
        for (let i = 0; i < 10; i++) {
            const type = basicTypes[i % basicTypes.length];

            if (type === "dialogueComplete") {
                const template = dialogueTemplates[i % dialogueTemplates.length];
                generatedQuestions.push({
                    type: "dialogueComplete",
                    prompt: "대화를 완성하세요",
                    context: template.context,
                    sentence: `A: "${template.a}"\nB: "___"`,
                    correctAnswer: template.correct,
                    options: [...template.options].sort(() => Math.random() - 0.5),
                });
            } else if (type === "situationSentence") {
                const template = situationTemplates[i % situationTemplates.length];
                generatedQuestions.push({
                    type: "situationSentence",
                    prompt: "상황에 알맞은 말을 고르세요",
                    context: template.situation,
                    correctAnswer: template.correct,
                    options: [...template.options].sort(() => Math.random() - 0.5),
                });
            } else if (type === "situationQuestion") {
                const template = questionTemplates[i % questionTemplates.length];
                generatedQuestions.push({
                    type: "situationQuestion",
                    prompt: "상황에 알맞은 질문을 고르세요",
                    context: template.situation,
                    correctAnswer: template.correct,
                    options: [...template.options].sort(() => Math.random() - 0.5),
                });
            } else if (type === "listening") {
                const template = situationTemplates[i % situationTemplates.length];
                generatedQuestions.push({
                    type: "listening",
                    prompt: "듣고 알맞은 문장을 고르세요",
                    correctAnswer: template.correct,
                    options: [...template.options].sort(() => Math.random() - 0.5),
                    audioText: template.correct,
                });
            } else if (type === "particle") {
                const template = particleTemplates[i % particleTemplates.length];
                generatedQuestions.push({
                    type: "particle",
                    prompt: "알맞은 조사를 고르세요",
                    sentence: template.template,
                    correctAnswer: template.correct,
                    options: [...template.options].sort(() => Math.random() - 0.5),
                });
            } else if (type === "ending") {
                const template = endingTemplates[i % endingTemplates.length];
                generatedQuestions.push({
                    type: "ending",
                    prompt: "알맞은 어미를 고르세요",
                    sentence: template.template,
                    correctAnswer: template.correct,
                    options: [...template.options].sort(() => Math.random() - 0.5),
                    hint: template.hint,
                });
            } else if (type === "sentenceOrder") {
                const template = sentenceOrderTemplates[i % sentenceOrderTemplates.length];
                generatedQuestions.push({
                    type: "sentenceOrder",
                    prompt: "단어를 올바른 순서로 배열하세요",
                    words: [...template.words].sort(() => Math.random() - 0.5),
                    correctAnswer: template.correct,
                    hint: template.hint,
                });
            } else if (type === "wordTyping") {
                const template = typingTemplates[i % typingTemplates.length];
                generatedQuestions.push({
                    type: "wordTyping",
                    prompt: "빈칸에 알맞은 단어를 입력하세요",
                    sentence: template.sentence,
                    correctAnswer: template.answers[0],
                    hint: template.hint,
                    options: template.answers, // 정답 후보들
                });
            }
        }

        return generatedQuestions.sort(() => Math.random() - 0.5);
    }, []);

    // 연습 시작
    const startPractice = (level: number) => {
        setSelectedLevel(level);
        const newQuestions = generateQuestions(level);
        setQuestions(newQuestions);
        setTotalQuestions(newQuestions.length);
        setCurrentIndex(0);
        setHearts(5);
        setXp(0);
        setStreak(0);
        setCorrectCount(0);
        setSelectedAnswer(null);
        setTypedAnswer("");
        setSelectedWords([]);
        setShowResult(false);
        setViewMode("practice");
    };

    // 문장 순서 문제: 단어 선택
    const handleWordSelect = (word: string) => {
        if (showResult) return;
        setSelectedWords(prev => [...prev, word]);
        setAvailableWords(prev => {
            const idx = prev.indexOf(word);
            return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
        });
    };

    // 문장 순서 문제: 단어 제거
    const handleWordRemove = (index: number) => {
        if (showResult) return;
        const word = selectedWords[index];
        setSelectedWords(prev => [...prev.slice(0, index), ...prev.slice(index + 1)]);
        setAvailableWords(prev => [...prev, word]);
    };

    // 현재 문제 초기화 (문장 순서용)
    useEffect(() => {
        if (viewMode === "practice" && questions[currentIndex]?.type === "sentenceOrder") {
            setAvailableWords([...(questions[currentIndex].words || [])]);
            setSelectedWords([]);
        }
    }, [currentIndex, viewMode, questions]);

    // 정답 선택 (선택형)
    const handleSelectAnswer = (answer: string) => {
        if (showResult) return;

        setSelectedAnswer(answer);
        setShowResult(true);

        const currentQuestion = questions[currentIndex];
        const correct = answer === currentQuestion.correctAnswer;
        setIsCorrect(correct);

        if (correct) {
            const bonusXp = streak >= 2 ? 15 : 10;
            setXp(prev => prev + bonusXp);
            setStreak(prev => prev + 1);
            setCorrectCount(prev => prev + 1);
        } else {
            setHearts(prev => Math.max(0, prev - 1));
            setStreak(0);
        }
    };

    // 정답 제출 (문장 순서)
    const handleSubmitOrder = () => {
        if (showResult) return;

        const currentQuestion = questions[currentIndex];
        const userAnswer = selectedWords.join(" ");
        const correct = userAnswer === currentQuestion.correctAnswer;

        setIsCorrect(correct);
        setShowResult(true);

        if (correct) {
            const bonusXp = streak >= 2 ? 20 : 15; // 순서 문제는 더 높은 XP
            setXp(prev => prev + bonusXp);
            setStreak(prev => prev + 1);
            setCorrectCount(prev => prev + 1);
        } else {
            setHearts(prev => Math.max(0, prev - 1));
            setStreak(0);
        }
    };

    // 정답 제출 (타이핑)
    const handleSubmitTyping = () => {
        if (showResult) return;

        const currentQuestion = questions[currentIndex];
        const answers = currentQuestion.options || [currentQuestion.correctAnswer];
        const correct = answers.some(ans =>
            typedAnswer.trim().toLowerCase() === ans.toLowerCase()
        );

        setIsCorrect(correct);
        setShowResult(true);

        if (correct) {
            const bonusXp = streak >= 2 ? 20 : 15;
            setXp(prev => prev + bonusXp);
            setStreak(prev => prev + 1);
            setCorrectCount(prev => prev + 1);
        } else {
            setHearts(prev => Math.max(0, prev - 1));
            setStreak(0);
        }
    };

    // 다음 문제
    const handleNext = () => {
        if (hearts <= 0 || currentIndex >= questions.length - 1) {
            setViewMode("result");
        } else {
            setCurrentIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setTypedAnswer("");
            setSelectedWords([]);
            setShowResult(false);
        }
    };

    // 듣기 문제 TTS 재생
    const playAudio = () => {
        const currentQuestion = questions[currentIndex];
        if (currentQuestion?.audioText) {
            speak(currentQuestion.audioText);
        }
    };

    // 자동 재생 (듣기 문제)
    useEffect(() => {
        if (viewMode === "practice" && questions[currentIndex]?.type === "listening") {
            const timer = setTimeout(() => playAudio(), 500);
            return () => clearTimeout(timer);
        }
    }, [currentIndex, viewMode, questions]);

    const currentQuestion = questions[currentIndex];

    // 레벨 선택 화면
    if (viewMode === "select") {
        return (
            <main className="min-h-screen bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600">
                <header className="bg-white/10 backdrop-blur-sm sticky top-0 z-10">
                    <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
                        <Link href="/" className="text-white hover:text-white/80">
                            ← 홈
                        </Link>
                        <h1 className="font-bold text-white text-lg">🎯 단어 연습</h1>
                        <div className="w-12"></div>
                    </div>
                </header>

                <div className="max-w-lg mx-auto px-4 py-8">
                    <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
                        <div className="text-center mb-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <span className="text-4xl">📚</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">실전 한국어 연습</h2>
                            <p className="text-gray-600">실생활에서 사용하는 한국어를 연습하세요!</p>
                        </div>

                        {/* 게임 설명 */}
                        <div className="grid grid-cols-3 gap-3 mb-6 text-center">
                            <div className="bg-red-50 rounded-xl p-3">
                                <span className="text-2xl">❤️</span>
                                <p className="text-xs text-gray-600 mt-1">5개의 하트</p>
                            </div>
                            <div className="bg-yellow-50 rounded-xl p-3">
                                <span className="text-2xl">⚡</span>
                                <p className="text-xs text-gray-600 mt-1">XP 획득</p>
                            </div>
                            <div className="bg-orange-50 rounded-xl p-3">
                                <span className="text-2xl">🔥</span>
                                <p className="text-xs text-gray-600 mt-1">연속 정답</p>
                            </div>
                        </div>

                        {/* 문제 유형 */}
                        <div className="bg-gray-50 rounded-xl p-4 mb-6">
                            <h3 className="font-semibold text-gray-800 mb-3">📝 문제 유형</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-xs">💬</span>
                                    <span className="text-gray-600">대화 완성</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center text-xs">📍</span>
                                    <span className="text-gray-600">상황별 문장</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 bg-green-100 rounded flex items-center justify-center text-xs">❓</span>
                                    <span className="text-gray-600">질문하기</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 bg-yellow-100 rounded flex items-center justify-center text-xs">🎧</span>
                                    <span className="text-gray-600">듣기</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 bg-pink-100 rounded flex items-center justify-center text-xs">은</span>
                                    <span className="text-gray-600">조사/어미</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center text-xs">🔢</span>
                                    <span className="text-gray-600">문장 순서 (2+)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 비로그인 상태 확인 (단어장과 동일하게 차단) */}
                    {!isAuthenticated && (
                        <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col items-center justify-center p-6">
                            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-xl text-center">
                                <span className="text-5xl mb-4 block">🔒</span>
                                <h2 className="text-xl font-bold text-gray-800 mb-2">로그인이 필요합니다</h2>
                                <p className="text-gray-600 mb-6">
                                    단어 연습은 회원 전용 기능입니다.<br />
                                    로그인 후 이용해 주세요.
                                </p>
                                <Link
                                    href="/login"
                                    className="block w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors"
                                >
                                    로그인하기
                                </Link>
                                <Link
                                    href="/"
                                    className="block mt-4 text-gray-400 text-sm hover:text-gray-600"
                                >
                                    홈으로 돌아가기
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* 레벨 선택 */}
                    <h3 className="text-white font-bold mb-4">학습할 레벨 선택</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {levelWordCounts.map(({ level, count }) => {
                            // 0, 1단계는 무료, 2단계부터는 프리미엄 필요
                            const isLocked = level >= 2 && !isPremium;

                            return (
                                <button
                                    key={level}
                                    onClick={() => {
                                        if (isLocked) {
                                            setShowUpgradeModal(true);
                                            return;
                                        }
                                        startPractice(level);
                                    }}
                                    className={`rounded-2xl p-4 shadow-lg transition-all text-left relative overflow-hidden ${isLocked ? "bg-gray-200 opacity-90 cursor-not-allowed" : "bg-white hover:shadow-xl hover:scale-105"}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isLocked ? "bg-gray-300" : (level === 0 ? "bg-green-100" :
                                            level === 1 ? "bg-blue-100" :
                                                level === 2 ? "bg-purple-100" :
                                                    level === 3 ? "bg-orange-100" :
                                                        level === 4 ? "bg-red-100" : "bg-yellow-100")
                                            }`}>
                                            <span className="text-xl font-bold text-gray-700">{isLocked ? "🔒" : level}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-gray-800 flex items-center gap-1">
                                                {level}단계
                                                {isLocked && <span className="text-[10px] text-red-500 border border-red-300 px-1 rounded bg-white">PRO</span>}
                                            </h4>
                                            <p className="text-xs text-gray-500">{count}개 단어</p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <SubscriptionModal
                    isOpen={showUpgradeModal}
                    onClose={() => setShowUpgradeModal(false)}
                />
            </main>
        );
    }

    // 결과 화면
    if (viewMode === "result") {
        const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
        const isPerfect = hearts === 5 && correctCount === totalQuestions;

        return (
            <main className="min-h-screen bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${isPerfect ? "bg-gradient-to-br from-yellow-400 to-orange-500" :
                        accuracy >= 70 ? "bg-gradient-to-br from-green-400 to-emerald-500" :
                            "bg-gradient-to-br from-blue-400 to-blue-500"
                        }`}>
                        <span className="text-5xl">
                            {isPerfect ? "🏆" : accuracy >= 70 ? "🎉" : "💪"}
                        </span>
                    </div>

                    <h2 className="text-3xl font-bold text-gray-800 mb-2">
                        {isPerfect ? "완벽해요!" : accuracy >= 70 ? "잘했어요!" : "좋은 시도예요!"}
                    </h2>
                    <p className="text-gray-600 mb-6">
                        {selectedLevel}단계 연습을 완료했습니다
                    </p>

                    {/* 통계 */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="bg-yellow-50 rounded-xl p-4">
                            <div className="text-2xl font-bold text-yellow-600">⚡ {xp}</div>
                            <div className="text-xs text-yellow-700">획득 XP</div>
                        </div>
                        <div className="bg-green-50 rounded-xl p-4">
                            <div className="text-2xl font-bold text-green-600">{correctCount}/{totalQuestions}</div>
                            <div className="text-xs text-green-700">정답</div>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-4">
                            <div className="text-2xl font-bold text-blue-600">{accuracy}%</div>
                            <div className="text-xs text-blue-700">정확도</div>
                        </div>
                    </div>

                    {/* 남은 하트 */}
                    <div className="flex justify-center gap-1 mb-8">
                        {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-2xl ${i < hearts ? "" : "opacity-30"}`}>
                                ❤️
                            </span>
                        ))}
                    </div>

                    {/* 버튼 */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => setViewMode("select")}
                            className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                        >
                            레벨 선택
                        </button>
                        <button
                            onClick={() => startPractice(selectedLevel)}
                            className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-bold hover:from-blue-600 hover:to-indigo-600 transition-colors"
                        >
                            다시 도전
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    // 연습 화면
    return (
        <main className="min-h-screen bg-gray-50 flex flex-col">
            {/* 상단 상태바 */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-lg mx-auto px-4 py-3">
                    <div className="flex items-center justify-between mb-3">
                        <button
                            onClick={() => setViewMode("select")}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button>

                        {/* 하트 */}
                        <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                                <span
                                    key={i}
                                    className={`text-lg transition-all ${i < hearts ? "scale-100" : "scale-75 opacity-30"
                                        }`}
                                >
                                    ❤️
                                </span>
                            ))}
                        </div>

                        {/* XP */}
                        <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full">
                            <span className="text-yellow-600">⚡</span>
                            <span className="font-bold text-yellow-700">{xp}</span>
                        </div>
                    </div>

                    {/* 진행률 바 */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-500"
                                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                            />
                        </div>
                        <span className="text-sm text-gray-500 font-medium">
                            {currentIndex + 1}/{questions.length}
                        </span>
                    </div>

                    {/* 연속 정답 표시 */}
                    {streak >= 2 && (
                        <div className="flex justify-center mt-2">
                            <div className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                                <span>🔥</span>
                                <span>{streak} 연속 정답!</span>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* 문제 영역 */}
            <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6 flex flex-col">
                {currentQuestion && (
                    <>
                        {/* 문제 타입별 아이콘 */}
                        <div className="text-center mb-4">
                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${currentQuestion.type === "dialogueComplete" ? "bg-blue-100 text-blue-700" :
                                currentQuestion.type === "situationSentence" ? "bg-purple-100 text-purple-700" :
                                    currentQuestion.type === "situationQuestion" ? "bg-green-100 text-green-700" :
                                        currentQuestion.type === "listening" ? "bg-yellow-100 text-yellow-700" :
                                            currentQuestion.type === "particle" ? "bg-pink-100 text-pink-700" :
                                                currentQuestion.type === "ending" ? "bg-orange-100 text-orange-700" :
                                                    currentQuestion.type === "sentenceOrder" ? "bg-indigo-100 text-indigo-700" :
                                                        "bg-teal-100 text-teal-700"
                                }`}>
                                {currentQuestion.type === "dialogueComplete" && "💬 대화 완성"}
                                {currentQuestion.type === "situationSentence" && "📍 상황별 문장"}
                                {currentQuestion.type === "situationQuestion" && "❓ 질문하기"}
                                {currentQuestion.type === "listening" && "🎧 듣기"}
                                {currentQuestion.type === "particle" && "📝 조사 맞추기"}
                                {currentQuestion.type === "ending" && "✍️ 어미 맞추기"}
                                {currentQuestion.type === "sentenceOrder" && "🔢 문장 순서"}
                                {currentQuestion.type === "wordTyping" && "⌨️ 단어 입력"}
                            </span>
                        </div>

                        {/* 문제 내용 */}
                        <div className="text-center mb-6 flex-1 flex flex-col justify-center">
                            <p className="text-lg font-medium text-gray-800 mb-4">{currentQuestion.prompt}</p>

                            {/* 상황 설명 */}
                            {currentQuestion.context && (
                                <div className="bg-blue-50 rounded-xl p-4 mb-4 text-left">
                                    <p className="text-sm text-blue-600 font-medium">📌 상황</p>
                                    <p className="text-gray-700">{currentQuestion.context}</p>
                                </div>
                            )}

                            {/* 듣기 문제 */}
                            {currentQuestion.type === "listening" && (
                                <button
                                    onClick={playAudio}
                                    className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105 mb-4"
                                >
                                    <span className="text-4xl text-white">🔊</span>
                                </button>
                            )}

                            {/* 대화 문장 */}
                            {currentQuestion.sentence && currentQuestion.type === "dialogueComplete" && (
                                <div className="bg-white rounded-2xl p-6 shadow-sm mx-auto w-full max-w-sm text-left">
                                    {currentQuestion.sentence.split('\n').map((line, i) => (
                                        <p key={i} className="text-lg text-gray-800 mb-2">
                                            {line.includes("___") ? (
                                                <>
                                                    {line.split("___")[0]}
                                                    <span className="inline-block w-24 border-b-4 border-dashed border-blue-400 mx-1" />
                                                    {line.split("___")[1]}
                                                </>
                                            ) : line}
                                        </p>
                                    ))}
                                </div>
                            )}

                            {/* 조사/어미 문장 */}
                            {currentQuestion.sentence && (currentQuestion.type === "particle" || currentQuestion.type === "ending") && (
                                <div className="bg-white rounded-2xl p-6 shadow-sm mx-auto w-full max-w-sm">
                                    <p className="text-2xl text-gray-800 font-medium">
                                        {currentQuestion.sentence.split("___").map((part, i, arr) => (
                                            <span key={i}>
                                                {part}
                                                {i < arr.length - 1 && (
                                                    <span className="inline-block w-12 border-b-4 border-dashed border-blue-400 mx-1" />
                                                )}
                                            </span>
                                        ))}
                                    </p>
                                    {currentQuestion.hint && (
                                        <p className="text-sm text-gray-500 mt-3">💡 {currentQuestion.hint}</p>
                                    )}
                                </div>
                            )}

                            {/* 문장 순서 */}
                            {currentQuestion.type === "sentenceOrder" && (
                                <div className="space-y-4">
                                    {/* 선택된 단어들 */}
                                    <div className="bg-white rounded-2xl p-4 min-h-16 shadow-sm border-2 border-dashed border-gray-300">
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            {selectedWords.length === 0 ? (
                                                <p className="text-gray-400 py-2">단어를 순서대로 선택하세요</p>
                                            ) : (
                                                selectedWords.map((word, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => handleWordRemove(i)}
                                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600"
                                                    >
                                                        {word} ✕
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* 사용 가능한 단어들 */}
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {availableWords.map((word, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleWordSelect(word)}
                                                disabled={showResult}
                                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50"
                                            >
                                                {word}
                                            </button>
                                        ))}
                                    </div>

                                    {currentQuestion.hint && (
                                        <p className="text-sm text-gray-500">💡 힌트: {currentQuestion.hint}</p>
                                    )}
                                </div>
                            )}

                            {/* 단어 타이핑 */}
                            {currentQuestion.type === "wordTyping" && (
                                <div className="space-y-4">
                                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                                        <p className="text-2xl text-gray-800 font-medium">
                                            {currentQuestion.sentence?.split("___").map((part, i, arr) => (
                                                <span key={i}>
                                                    {part}
                                                    {i < arr.length - 1 && (
                                                        <span className="inline-block w-20 border-b-4 border-dashed border-blue-400 mx-1" />
                                                    )}
                                                </span>
                                            ))}
                                        </p>
                                    </div>

                                    <input
                                        type="text"
                                        value={typedAnswer}
                                        onChange={(e) => setTypedAnswer(e.target.value)}
                                        disabled={showResult}
                                        placeholder="답을 입력하세요..."
                                        className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-center"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && typedAnswer.trim()) {
                                                handleSubmitTyping();
                                            }
                                        }}
                                    />

                                    {currentQuestion.hint && (
                                        <p className="text-sm text-gray-500">💡 힌트: {currentQuestion.hint}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 선택지 (선택형 문제) */}
                        {currentQuestion.options && currentQuestion.type !== "wordTyping" && currentQuestion.type !== "sentenceOrder" && (
                            <div className={`grid gap-3 mb-6 ${currentQuestion.type === "particle" || currentQuestion.type === "ending"
                                ? "grid-cols-2"
                                : "grid-cols-1"
                                }`}>
                                {currentQuestion.options.map((option, index) => {
                                    let buttonClass = "w-full p-4 rounded-2xl border-2 font-medium transition-all text-left ";

                                    if (showResult) {
                                        if (option === currentQuestion.correctAnswer) {
                                            buttonClass += "border-green-500 bg-green-50 text-green-700";
                                        } else if (option === selectedAnswer && option !== currentQuestion.correctAnswer) {
                                            buttonClass += "border-red-500 bg-red-50 text-red-700";
                                        } else {
                                            buttonClass += "border-gray-200 text-gray-400";
                                        }
                                    } else {
                                        if (selectedAnswer === option) {
                                            buttonClass += "border-blue-500 bg-blue-50 text-blue-700";
                                        } else {
                                            buttonClass += "border-gray-200 hover:border-blue-300 bg-white";
                                        }
                                    }

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => handleSelectAnswer(option)}
                                            disabled={showResult}
                                            className={buttonClass}
                                        >
                                            <div className={`flex items-center ${currentQuestion.type === "particle" || currentQuestion.type === "ending"
                                                ? "justify-center text-xl"
                                                : "gap-3"
                                                }`}>
                                                {currentQuestion.type !== "particle" && currentQuestion.type !== "ending" && (
                                                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${showResult
                                                        ? option === currentQuestion.correctAnswer
                                                            ? "bg-green-100 text-green-600"
                                                            : option === selectedAnswer
                                                                ? "bg-red-100 text-red-600"
                                                                : "bg-gray-100 text-gray-400"
                                                        : "bg-gray-100 text-gray-600"
                                                        }`}>
                                                        {index + 1}
                                                    </span>
                                                )}
                                                <span>{option}</span>
                                                {showResult && option === currentQuestion.correctAnswer && (
                                                    <span className="ml-auto text-green-500">✓</span>
                                                )}
                                                {showResult && option === selectedAnswer && option !== currentQuestion.correctAnswer && (
                                                    <span className="ml-auto text-red-500">✕</span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* 제출 버튼 (문장 순서, 타이핑) */}
                        {!showResult && (currentQuestion.type === "sentenceOrder" || currentQuestion.type === "wordTyping") && (
                            <button
                                onClick={currentQuestion.type === "sentenceOrder" ? handleSubmitOrder : handleSubmitTyping}
                                disabled={
                                    (currentQuestion.type === "sentenceOrder" && selectedWords.length === 0) ||
                                    (currentQuestion.type === "wordTyping" && !typedAnswer.trim())
                                }
                                className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-indigo-600 transition-colors"
                            >
                                확인하기
                            </button>
                        )}

                        {/* 결과 피드백 & 다음 버튼 */}
                        {showResult && (
                            <div className={`rounded-2xl p-4 mb-4 ${isCorrect ? "bg-green-100" : "bg-red-100"
                                }`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{isCorrect ? "🎉" : "😢"}</span>
                                        <div>
                                            <p className={`font-bold ${isCorrect ? "text-green-700" : "text-red-700"}`}>
                                                {isCorrect ? "정답입니다!" : "오답입니다"}
                                            </p>
                                            {!isCorrect && (
                                                <p className="text-sm text-red-600">
                                                    정답: {currentQuestion.correctAnswer}
                                                </p>
                                            )}
                                            {isCorrect && streak >= 2 && (
                                                <p className="text-sm text-green-600">
                                                    +{currentQuestion.type === "sentenceOrder" || currentQuestion.type === "wordTyping" ? 20 : 15} XP (연속 정답 보너스!)
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleNext}
                                        className={`px-6 py-3 rounded-xl font-bold text-white ${isCorrect
                                            ? "bg-green-500 hover:bg-green-600"
                                            : "bg-red-500 hover:bg-red-600"
                                            } transition-colors`}
                                    >
                                        {currentIndex < questions.length - 1 ? "계속" : "결과 보기"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 하트 소진 경고 */}
                        {hearts === 1 && !showResult && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                                <p className="text-red-600 text-sm font-medium">
                                    ⚠️ 하트가 1개 남았어요! 신중하게 선택하세요.
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
