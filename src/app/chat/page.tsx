"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTTS } from "@/hooks/useTTS";
import { useProgress } from "@/contexts/ProgressContext";
import { useAuth } from "@/contexts/AuthContext";
import BottomNav from "@/components/BottomNav";

// JSON 파일에서 대화 데이터 import
import conversationsData from "@/data/conversations.json";

interface DialogueLine {
    speaker: string;
    role: "user" | "other";
    text: string;
    avatar: string;
    translation: string;
}

interface Conversation {
    id: number;
    level: number;
    title: string;
    category: string;
    icon: string;
    description: string;
    dialogue: DialogueLine[];
    vocabulary: string[];
    grammar: string[];
    cultureTip: string;
}

const conversations: Conversation[] = conversationsData.conversations as Conversation[];

type ViewMode = "list" | "learn";

export default function ConversationPage() {
    const { hasAiTutorAccess } = useProgress();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const hasAccess = hasAiTutorAccess();
    const { speak } = useTTS({ isPremium: hasAccess });
    const [viewMode, setViewMode] = useState<ViewMode>("list");
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [bookmarked, setBookmarked] = useState<Set<number>>(new Set());
    const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
    const [showTranslation, setShowTranslation] = useState<Set<number>>(new Set());
    const [showVocabulary, setShowVocabulary] = useState(false);
    const [showCultureTip, setShowCultureTip] = useState(false);

    // 비로그인 사용자는 로그인 페이지로 리다이렉트
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [authLoading, isAuthenticated, router]);

    // 로그인 확인 중 or 비로그인 상태면 로딩 표시
    if (authLoading || !isAuthenticated) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </main>
        );
    }

    // AI 튜터 구독이 없는 경우 구독 안내 페이지 표시
    if (!hasAccess) {
        return (
            <main className="min-h-screen bg-gray-50 pb-nav">
                <header className="bg-white sticky top-0 z-40 border-b border-gray-100">
                    <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
                        <Link href="/" className="text-gray-600">
                            <span className="text-xl">←</span>
                        </Link>
                        <h1 className="font-bold text-gray-800">AI 튜터</h1>
                        <div className="w-6" />
                    </div>
                </header>

                <div className="max-w-lg mx-auto px-4 py-12">
                    <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
                        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">🤖</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">AI 튜터 구독 필요</h2>
                        <p className="text-gray-600 mb-6">
                            AI 튜터 기능을 이용하려면 프리미엄 구독이 필요합니다.<br />
                            실시간 대화와 TTS 발음 학습을 경험해보세요!
                        </p>
                        <Link
                            href="/subscription"
                            className="inline-block w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl font-semibold hover:from-purple-600 hover:to-indigo-700 transition-all"
                        >
                            구독하고 AI 튜터 이용하기
                        </Link>
                    </div>
                </div>

                <BottomNav />
            </main>
        );
    }

    // 레벨별 대화 필터링
    const filteredConversations = selectedLevel !== null
        ? conversations.filter(c => c.level === selectedLevel)
        : conversations;

    // 레벨별 색상
    const getLevelColor = (level: number) => {
        const colors = [
            "bg-emerald-100 text-emerald-700",
            "bg-blue-100 text-blue-700",
            "bg-purple-100 text-purple-700",
            "bg-orange-100 text-orange-700",
            "bg-rose-100 text-rose-700",
            "bg-indigo-100 text-indigo-700"
        ];
        return colors[level] || colors[0];
    };

    const getLevelName = (level: number) => {
        const names = ["기초", "초급 1", "초급 2", "중급 1", "중급 2", "고급"];
        return names[level] || "기초";
    };

    const toggleBookmark = () => {
        if (!selectedConversation) return;
        setBookmarked(prev => {
            const newSet = new Set(prev);
            if (newSet.has(selectedConversation.id)) {
                newSet.delete(selectedConversation.id);
            } else {
                newSet.add(selectedConversation.id);
            }
            return newSet;
        });
    };

    const toggleTranslation = (idx: number) => {
        setShowTranslation(prev => {
            const newSet = new Set(prev);
            if (newSet.has(idx)) {
                newSet.delete(idx);
            } else {
                newSet.add(idx);
            }
            return newSet;
        });
    };

    const handleSelectConversation = (conv: Conversation) => {
        setSelectedConversation(conv);
        setViewMode("learn");
        setShowTranslation(new Set());
        setShowVocabulary(false);
        setShowCultureTip(false);
    };

    // 목록 화면
    if (viewMode === "list") {
        return (
            <main className="min-h-screen bg-gray-50 pb-nav">
                <header className="bg-white sticky top-0 z-40 border-b border-gray-100">
                    <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
                        <Link href="/" className="text-gray-600">
                            <span className="text-xl">←</span>
                        </Link>
                        <h1 className="font-bold text-gray-800">상황별 대화 학습</h1>
                        <div className="w-6" />
                    </div>
                </header>

                <div className="max-w-lg mx-auto px-4 py-6">
                    <p className="text-gray-600 text-sm mb-4">
                        실생활에서 자주 사용하는 대화를 연습해보세요.
                        교재보다 더 풍부하고 자연스러운 대화 예시입니다.
                    </p>

                    {/* 레벨 필터 */}
                    <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
                        <button
                            onClick={() => setSelectedLevel(null)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedLevel === null
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-600"
                                }`}
                        >
                            전체 ({conversations.length})
                        </button>
                        {[0, 1, 2, 3, 4, 5].map(level => {
                            const count = conversations.filter(c => c.level === level).length;
                            if (count === 0) return null;
                            return (
                                <button
                                    key={level}
                                    onClick={() => setSelectedLevel(level)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedLevel === level
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 text-gray-600"
                                        }`}
                                >
                                    {getLevelName(level)} ({count})
                                </button>
                            );
                        })}
                    </div>

                    {/* 대화 목록 */}
                    <div className="space-y-4">
                        {filteredConversations.map(conv => (
                            <button
                                key={conv.id}
                                onClick={() => handleSelectConversation(conv)}
                                className="w-full bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                                        <span className="text-2xl">{conv.icon}</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getLevelColor(conv.level)}`}>
                                                {getLevelName(conv.level)}
                                            </span>
                                            <span className="text-xs text-blue-600 font-medium">{conv.category}</span>
                                        </div>
                                        <h3 className="font-bold text-gray-800">{conv.title}</h3>
                                        <p className="text-sm text-gray-500">{conv.description}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-xs text-gray-400">💬 {conv.dialogue.length}개 대화</span>
                                            <span className="text-xs text-gray-400">📚 {conv.vocabulary.length}개 어휘</span>
                                        </div>
                                    </div>
                                    {bookmarked.has(conv.id) && (
                                        <span className="text-yellow-500">⭐</span>
                                    )}
                                    <span className="text-gray-400">→</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {filteredConversations.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            해당 레벨의 대화가 없습니다.
                        </div>
                    )}
                </div>

                <BottomNav />
            </main>
        );
    }

    // 대화 학습 화면
    if (!selectedConversation) return null;

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col">
            {/* 헤더 */}
            <header className="bg-white sticky top-0 z-40 border-b border-gray-100">
                <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
                    <button onClick={() => setViewMode("list")} className="text-gray-600">
                        <span className="text-xl">←</span>
                    </button>
                    <div className="text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getLevelColor(selectedConversation.level)}`}>
                            {getLevelName(selectedConversation.level)}
                        </span>
                    </div>
                    <button onClick={toggleBookmark} className="text-xl">
                        {bookmarked.has(selectedConversation.id) ? "⭐" : "☆"}
                    </button>
                </div>
            </header>

            {/* 주제 헤더 */}
            <div className="bg-white border-b border-gray-100 px-4 py-4">
                <div className="max-w-lg mx-auto">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <span className="text-2xl">{selectedConversation.icon}</span>
                        <h2 className="text-lg font-bold text-gray-800">{selectedConversation.title}</h2>
                    </div>
                    <p className="text-sm text-gray-500 text-center">{selectedConversation.description}</p>
                </div>
            </div>

            {/* 대화 내용 */}
            <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-5 overflow-y-auto">
                {selectedConversation.dialogue.map((line, idx) => (
                    <div
                        key={idx}
                        className={`flex ${line.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        {line.role === "other" && (
                            <div className="flex items-start gap-3 max-w-[85%]">
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-lg">{line.avatar}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-500 mb-1 block">{line.speaker}</span>
                                    <div className="bg-white rounded-2xl rounded-bl-sm p-4 shadow-sm">
                                        <p className="text-gray-800">{line.text}</p>
                                        {showTranslation.has(idx) && (
                                            <p className="text-sm text-gray-500 mt-2 pt-2 border-t border-gray-100">
                                                {line.translation}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-3 mt-2">
                                        <button
                                            onClick={() => toggleTranslation(idx)}
                                            className={`text-xs flex items-center gap-1 transition-colors ${showTranslation.has(idx) ? "text-blue-600" : "text-gray-500 hover:text-blue-600"
                                                }`}
                                        >
                                            🌐 번역
                                        </button>
                                        <button
                                            onClick={() => speak(line.text)}
                                            className="text-xs text-gray-500 flex items-center gap-1 hover:text-blue-600"
                                        >
                                            🔊 듣기
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {line.role === "user" && (
                            <div className="flex items-start gap-3 max-w-[85%]">
                                <div className="order-2">
                                    <span className="text-xs text-gray-500 mb-1 block text-right">{line.speaker}</span>
                                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl rounded-br-sm p-4 shadow-sm">
                                        <p className="text-white">{line.text}</p>
                                        {showTranslation.has(idx) && (
                                            <p className="text-sm text-blue-100 mt-2 pt-2 border-t border-blue-400">
                                                {line.translation}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-3 mt-2 justify-end">
                                        <button
                                            onClick={() => toggleTranslation(idx)}
                                            className={`text-xs flex items-center gap-1 transition-colors ${showTranslation.has(idx) ? "text-blue-600" : "text-gray-500 hover:text-blue-600"
                                                }`}
                                        >
                                            🌐 번역
                                        </button>
                                        <button
                                            onClick={() => speak(line.text)}
                                            className="text-xs text-gray-500 flex items-center gap-1 hover:text-blue-600"
                                        >
                                            🔊 듣기
                                        </button>
                                    </div>
                                </div>
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 order-3">
                                    <span className="text-lg">{line.avatar}</span>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* 문화 팁 */}
            {showCultureTip && (
                <div className="max-w-lg mx-auto w-full px-4 pb-4">
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">🌏</span>
                            <span className="font-bold text-amber-800">문화 팁</span>
                        </div>
                        <p className="text-sm text-amber-900">{selectedConversation.cultureTip}</p>
                    </div>
                </div>
            )}

            {/* 핵심 어휘 */}
            {showVocabulary && (
                <div className="max-w-lg mx-auto w-full px-4 pb-4">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">📚</span>
                            <span className="font-bold text-gray-800">핵심 어휘</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {selectedConversation.vocabulary.map((word, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => speak(word)}
                                    className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-blue-100 transition-colors"
                                >
                                    {word} 🔊
                                </button>
                            ))}
                        </div>
                        <div className="pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">📝</span>
                                <span className="font-bold text-gray-800 text-sm">주요 문법</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {selectedConversation.grammar.map((g, idx) => (
                                    <span key={idx} className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm">
                                        {g}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 하단 버튼 영역 */}
            <div className="bg-white border-t border-gray-100 px-4 py-4">
                <div className="max-w-lg mx-auto space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setShowVocabulary(!showVocabulary)}
                            className={`py-3 rounded-2xl font-medium transition-colors flex items-center justify-center gap-2 ${showVocabulary
                                ? "bg-blue-600 text-white"
                                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                                }`}
                        >
                            📚 핵심 어휘
                        </button>
                        <button
                            onClick={() => setShowCultureTip(!showCultureTip)}
                            className={`py-3 rounded-2xl font-medium transition-colors flex items-center justify-center gap-2 ${showCultureTip
                                ? "bg-amber-500 text-white"
                                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                                }`}
                        >
                            🌏 문화 팁
                        </button>
                    </div>
                    <button className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center gap-2">
                        🤖 AI 튜터에게 질문하기
                    </button>
                </div>
            </div>
        </main>
    );
}
