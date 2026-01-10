"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getVocabulary, getVocabularyTopics, VocabularyItem } from "@/lib/supabase";
import { useTTS } from "@/hooks/useTTS";
import { useProgress } from "@/contexts/ProgressContext";
import { levelContents } from "@/data/levelContent";
import ProgressBar from "@/components/ProgressBar";
import BottomNav from "@/components/BottomNav";

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

export default function VocabularyPage() {
    const { hasAiTutorAccess } = useProgress();
    const { speak } = useTTS({ isPremium: hasAiTutorAccess() });
    const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
    const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>("select");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [bookmarked, setBookmarked] = useState<Set<number>>(new Set());

    // 레벨 선택 시 단어 가져오기
    useEffect(() => {
        if (selectedLevel === null) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const vocabData = await getVocabulary(selectedLevel);
                if (vocabData.length > 0) {
                    setVocabulary(vocabData);
                } else {
                    setVocabulary(getFallbackVocabulary(selectedLevel));
                }
            } catch {
                setVocabulary(getFallbackVocabulary(selectedLevel));
            }
            setCurrentIndex(0);
            setIsLoading(false);
        };
        fetchData();
    }, [selectedLevel]);

    const handleLevelSelect = (level: number) => {
        setSelectedLevel(level);
        setViewMode("learn");
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < vocabulary.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const toggleBookmark = (id: number) => {
        setBookmarked(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const currentWord = vocabulary[currentIndex];

    // 레벨 선택 화면
    if (viewMode === "select") {
        return (
            <main className="min-h-screen bg-gray-50 pb-nav">
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

                    {[0, 1, 2, 3, 4, 5].map(level => {
                        const levelData = getFallbackVocabulary(level);
                        const wordCount = levelData.length;

                        return (
                            <button
                                key={level}
                                onClick={() => handleLevelSelect(level)}
                                className="w-full bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                        <span className="text-xl">📖</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-800">{level}단계 단어장</h3>
                                        <p className="text-sm text-gray-500">{wordCount}개 단어</p>
                                    </div>
                                    <span className="text-gray-400">→</span>
                                </div>
                            </button>
                        );
                    })}
                </div>

                <BottomNav />
            </main>
        );
    }

    // 로딩 화면
    if (isLoading) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center">
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
            <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
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
        <main className="min-h-screen bg-gray-50 flex flex-col">
            {/* 헤더 */}
            <header className="bg-white sticky top-0 z-40 border-b border-gray-100">
                <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
                    <button onClick={() => setViewMode("select")} className="text-gray-600">
                        <span className="text-xl">←</span>
                    </button>
                    <h1 className="font-bold text-gray-800">단어 학습</h1>
                    <button
                        onClick={() => toggleBookmark(currentWord.id)}
                        className="text-xl"
                    >
                        {bookmarked.has(currentWord.id) ? "🔖" : "📑"}
                    </button>
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

            {/* 단어 카드 */}
            <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6 flex flex-col">
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
                    <button
                        onClick={handleNext}
                        disabled={currentIndex === vocabulary.length - 1}
                        className={`flex-1 py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 ${currentIndex < vocabulary.length - 1
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            }`}
                    >
                        다음 단어 학습 →
                    </button>
                </div>
            </div>
        </main>
    );
}
