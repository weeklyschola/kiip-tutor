"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getVocabulary, getVocabularyTopics, VocabularyItem } from "@/lib/supabase";
import { useTTS } from "@/hooks/useTTS";
import { useProgress } from "@/contexts/ProgressContext";
import { useAuth } from "@/contexts/AuthContext";
import { levelContents } from "@/data/levelContent";
import ProgressBar from "@/components/ProgressBar";
import BottomNav from "@/components/BottomNav";
import SubscriptionModal from "@/components/SubscriptionModal";

// JSON 파일에서 단어 데이터 import
import level0Data from "@/data/vocabulary/level0.json";
import level1Data from "@/data/vocabulary/level1.json";
import level2Data from "@/data/vocabulary/level2.json";
import level3Data from "@/data/vocabulary/level3.json";
import level4Data from "@/data/vocabulary/level4.json";
import level5Data from "@/data/vocabulary/level5.json";

// 레벨별 JSON 데이터 매핑
const vocabularyData: Record<number, { vocabulary: Array<{ word: string; meaning: string; pronunciation: string; topic: string; examples: string[]; hanja?: string; synonyms?: string[] }> }> = {
    0: level0Data,
    1: level1Data,
    2: level2Data,
    3: level3Data,
    4: level4Data,
    5: level5Data,
};

// JSON 또는 levelContent.ts에서 Fallback 데이터 생성
const getFallbackVocabulary = (level: number): VocabularyItem[] => {
    const jsonData = vocabularyData[level];
    if (jsonData && jsonData.vocabulary && jsonData.vocabulary.length > 0) {
        return jsonData.vocabulary.map((v, idx) => ({
            id: level * 1000 + idx,
            level,
            word: v.word,
            meaning: v.meaning,
            pronunciation: v.pronunciation,
            examples: v.examples,
            topic: v.topic,
            hanja: v.hanja,
            synonyms: v.synonyms,
        }));
    }

    const content = levelContents[level];
    if (!content) return [];
    return content.vocabulary.map((v, idx) => ({
        id: level * 1000 + idx,
        level,
        word: v.word,
        meaning: v.meaning,
        pronunciation: v.pronunciation,
        examples: v.examples,
        topic: v.topic,
    }));
};

type ViewMode = "select" | "learn";

export const dynamic = 'force-dynamic';

import { Suspense } from "react";

function VocabularyContent() {
    const { hasAiTutorAccess, getCardProgress, updateCardProgress } = useProgress();
    const { isAuthenticated } = useAuth(); // 로그인 여부 확인
    const { speak } = useTTS({ isPremium: hasAiTutorAccess() });
    const isPremium = hasAiTutorAccess(); // 프리미엄 여부

    const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
    const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>("select");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [bookmarked, setBookmarked] = useState<Set<number>>(new Set());
    const [showCompletion, setShowCompletion] = useState(false);

    // 유료 기능 안내 모달
    // 유료 기능 안내 모달 상태
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // 자동 진행 상태
    const [autoPlay, setAutoPlay] = useState(false);

    // 레벨 선택 핸들러
    const handleLevelSelect = (level: number) => {
        setSelectedLevel(level);
        setIsLoading(true);
        // 약 0.5초 딜레이 (로딩 효과)
        setTimeout(() => {
            const data = getFallbackVocabulary(level);
            setVocabulary(data);
            setIsLoading(false);
            setViewMode("learn");
            setCurrentIndex(0);
            setShowCompletion(false);
        }, 500);
    };

    // 현재 단어
    const currentWord = vocabulary[currentIndex];

    const handleNext = () => {
        if (currentIndex < vocabulary.length - 1) {
            setCurrentIndex(prev => prev + 1);
            if (autoPlay) {
                // 자동 재생 로직은 useEffect로 처리하거나 여기서 호출
                // 여기서는 간단히 다음 단어 음성 재생 (약간의 딜레이 후)
                // 하지만 speak 함수는 비동기라... 일단 생략하거나 useEffect에 의존
            }
        } else {
            setShowCompletion(true);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleRestart = () => {
        setCurrentIndex(0);
        setShowCompletion(false);
    };

    const toggleBookmark = (id: number) => {
        const newSet = new Set(bookmarked);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setBookmarked(newSet);
    };

    const handleAiTutorClick = () => {
        // if (!currentWord) return;
        // AI 튜터 페이지로 이동 (쿼리 파라미터 전달)
        // router가 없으므로 window.location 사용하거나 router import 필요
        // 상단에 router import가 없으므로 window.location.href 사용
        // window.location.href = `/chat?message=${encodeURIComponent(`"${currentWord.word}"의 뜻과 예문을 자세히 설명해줘.`)}`;

        // [User Request]: 단어장에서 튜터에게 물어보기를 누르면 구독 안내가 아니라 준비중입니다.로 변경
        alert("준비중입니다.");
    };

    // Auto Play Effect
    useEffect(() => {
        if (autoPlay && viewMode === 'learn' && currentWord && !showCompletion) {
            const timer = setTimeout(() => {
                speak(currentWord.word, undefined, undefined, () => {
                    // 단어 재생 후 예문 재생? 아니면 다음으로?
                    // 여기서는 단순히 단어 읽어주는 것만
                });
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [currentIndex, autoPlay, viewMode, currentWord, showCompletion, speak]);
    // 학습 완료 축하 화면
    if (showCompletion) {
        return (
            <main className="min-h-[100dvh] bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl p-10 shadow-xl max-w-sm w-full text-center border-2 border-white/50 backdrop-blur-sm">
                    <div className="text-6xl mb-6 animate-bounce">🎉</div>
                    <h2 className="text-3xl font-extrabold text-slate-800 mb-2">학습 완료!</h2>
                    <p className="text-slate-500 mb-8">
                        {selectedLevel}단계 단어장을 모두 공부하셨군요.<br />
                        정말 대단해요!
                    </p>

                    <button
                        onClick={() => {
                            setShowCompletion(false);
                            setViewMode("select");
                        }}
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-blue-700 hover:scale-[1.02] transition-all"
                    >
                        확인
                    </button>
                </div>
            </main>
        );
    }

    // 레벨 선택 화면
    if (viewMode === "select") {
        return (
            <main className="min-h-[100dvh] bg-gray-50 pb-nav">
                <header className="bg-white sticky top-0 z-40 border-b border-gray-100">
                    <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
                        <Link href="/" className="text-gray-600">
                            <span className="text-xl">←</span>
                        </Link>
                        <h1 className="font-bold text-gray-800">단어 학습</h1>
                        <div className="w-6" />
                    </div>
                </header>

                <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">학습할 레벨을 선택하세요</h2>

                    {/* 비로그인 상태일 경우 안내 메시지 표시 (사실상 아래 리다이렉트로 대체되지만 안전장치) */}
                    {!isAuthenticated && (
                        <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col items-center justify-center p-6">
                            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-xl text-center">
                                <span className="text-5xl mb-4 block">🔒</span>
                                <h2 className="text-xl font-bold text-gray-800 mb-2">로그인이 필요합니다</h2>
                                <p className="text-gray-600 mb-6">
                                    단어장은 회원 전용 기능입니다.<br />
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

                    {[0, 1, 2, 3, 4, 5].map(level => {
                        const levelData = getFallbackVocabulary(level);
                        const wordCount = levelData.length;
                        // 모든 레벨 무료로 개방
                        const isLocked = false;

                        return (
                            <button
                                key={level}
                                onClick={() => {
                                    if (isLocked) {
                                        setShowUpgradeModal(true);
                                        return;
                                    }
                                    handleLevelSelect(level);
                                }}
                                className={`w-full bg-white rounded-2xl p-5 shadow-sm transition-all text-left relative overflow-hidden ${isLocked ? "opacity-75 bg-gray-100" : "hover:shadow-md"}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isLocked ? "bg-gray-200" : "bg-blue-100"}`}>
                                        <span className="text-xl">{isLocked ? "🔒" : "📖"}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-800">
                                            {level}단계 단어장
                                            {isLocked && <span className="ml-2 text-xs text-red-500 font-normal border border-red-200 px-1.5 py-0.5 rounded-full">Premium</span>}
                                        </h3>
                                        <p className="text-sm text-gray-500">{wordCount}개 단어</p>
                                    </div>
                                    <span className={`text-gray-400 ${isLocked ? "opacity-0" : ""}`}>→</span>
                                </div>
                            </button>
                        );
                    })}
                </div>

                <BottomNav />
                <SubscriptionModal
                    isOpen={showUpgradeModal}
                    onClose={() => setShowUpgradeModal(false)}
                />
            </main>
        );
    }

    // 로딩 화면
    if (isLoading) {
        return (
            <main className="min-h-[100dvh] bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-500">단어를 불러오는 중...</p>
                </div>
            </main>
        );
    }

    // 단어가 없는 경우
    if (vocabulary.length === 0) {
        return (
            <main className="min-h-[100dvh] bg-gray-50 flex flex-col items-center justify-center p-4">
                <span className="text-5xl mb-4">📭</span>
                <p className="text-gray-500 mb-4">이 레벨에는 아직 단어가 없습니다</p>
                <button
                    onClick={() => setViewMode("select")}
                    className="px-6 py-3 bg-blue-600 text-white rounded-full font-semibold"
                >
                    레벨 다시 선택
                </button>
            </main>
        );
    }

    // 단어 학습 화면
    return (
        <main className="min-h-[100dvh] bg-gray-50 pb-24">
            {/* 헤더 */}
            <header className="bg-white sticky top-0 z-40 border-b border-gray-100">
                <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
                    <button onClick={() => setViewMode("select")} className="text-gray-600">
                        <span className="text-xl">←</span>
                    </button>
                    <h1 className="font-bold text-gray-800">단어 학습</h1>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setAutoPlay(!autoPlay)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${autoPlay ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}
                        >
                            {autoPlay ? "자동 재생 ON" : "자동 재생 OFF"}
                        </button>
                        <button
                            onClick={() => toggleBookmark(currentWord.id)}
                            className="text-xl"
                        >
                            {bookmarked.has(currentWord.id) ? "🔖" : "📑"}
                        </button>
                    </div>
                </div>
            </header>

            {/* 진행률 */}
            <div className="bg-white border-b border-gray-100 px-4 py-3">
                <div className="max-w-lg mx-auto">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-500">학습 진행도</span>
                        <span className="text-sm font-medium text-blue-600">
                            {currentIndex + 1} / {vocabulary.length}
                        </span>
                    </div>
                    <ProgressBar value={((currentIndex + 1) / vocabulary.length) * 100} size="sm" />
                </div>
            </div>

            {/* 단어 카드 (스크롤은 메인 페이지 스크롤 사용) */}
            <div className="max-w-lg mx-auto w-full px-4 py-6">
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    {/* 메인 단어 - 클릭하면 발음 듣기 */}
                    <button
                        onClick={() => speak(currentWord.word)}
                        className="group flex flex-col items-center hover:scale-105 transition-transform"
                    >
                        <h2 className="text-5xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                            {currentWord.word}
                        </h2>
                        <div className="flex items-center gap-2 text-blue-600 text-lg mb-2">
                            <span>[{currentWord.pronunciation || currentWord.word}]</span>
                            <span className="text-xl">🔊</span>
                        </div>
                        <p className="text-xs text-gray-400">클릭하여 발음 듣기</p>
                    </button>

                    {/* 뜻 */}
                    <div className="bg-gray-100 rounded-2xl px-6 py-4 mb-6 mt-4 w-full max-w-sm">
                        <p className="text-gray-700">{currentWord.meaning}</p>
                    </div>

                    {/* 태그 (한자, 유의어) */}
                    <div className="flex flex-wrap gap-2 justify-center mb-8">
                        {(currentWord as any).hanja && (
                            <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm">
                                어원 {(currentWord as any).hanja}
                            </span>
                        )}
                        {(currentWord as any).synonyms && (currentWord as any).synonyms.length > 0 && (
                            <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm">
                                유의어 {(currentWord as any).synonyms.join(", ")}
                            </span>
                        )}
                    </div>

                    {/* 예문 학습 */}
                    <div className="w-full">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-gray-800">예문 학습</h3>
                            <button
                                onClick={() => speak(currentWord.examples[0] || currentWord.word)}
                                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"
                            >
                                🔊
                            </button>
                        </div>

                        {currentWord.examples && currentWord.examples.length > 0 && (
                            <div className="bg-blue-50 rounded-2xl p-5 text-left border-l-4 border-blue-500">
                                <p
                                    className="text-lg text-gray-800"
                                    dangerouslySetInnerHTML={{
                                        __html: `"${currentWord.examples[0].replace(
                                            new RegExp(currentWord.word, 'g'),
                                            `<span class="text-blue-600 font-bold underline">${currentWord.word}</span>`
                                        )}"`
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* AI 튜터 버튼 */}
                <div className="mt-6 space-y-3">
                    <button
                        onClick={handleAiTutorClick}
                        className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:from-blue-600 hover:to-blue-700 transition-all"
                    >
                        🤖 AI 튜터에게 이 문장 물어보기
                    </button>
                    <p className="text-center text-xs text-gray-400">
                        문법 설명이나 다른 예문이 궁금한가요?
                    </p>
                </div>

                {/* 하단 네비게이션 버튼 */}
                <div className="flex gap-3 mt-6 pb-4">
                    <button
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        className={`px-6 py-4 rounded-2xl font-medium flex items-center gap-2 ${currentIndex === 0
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                            }`}
                    >
                        ← 이전
                    </button>
                    {currentIndex < vocabulary.length - 1 ? (
                        <button
                            onClick={handleNext}
                            className="flex-1 py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
                        >
                            다음 단어 학습 →
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                        >
                            🎉 학습 완료!
                        </button>
                    )}
                </div>
            </div>
        </main>
    );
}

export default function VocabularyPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
            <VocabularyContent />
        </Suspense>
    );
}
