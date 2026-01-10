"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useProgress } from "@/contexts/ProgressContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PremiumPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const {
        progress,
        purchaseLevel,
        purchaseAiTutor,
        purchaseCbt,
        hasLevelAccess,
        hasAiTutorAccess,
        hasCbtAccess,
        getAiTutorDaysRemaining,
        getCbtDaysRemaining,
    } = useProgress();

    const [showConfirmModal, setShowConfirmModal] = useState<{
        type: "level" | "aiTutor" | "cbt";
        level?: number;
    } | null>(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/signup");
        }
    }, [authLoading, isAuthenticated, router]);

    if (authLoading) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </main>
        );
    }

    const handlePurchase = () => {
        if (!showConfirmModal) return;

        if (showConfirmModal.type === "level" && showConfirmModal.level) {
            purchaseLevel(showConfirmModal.level);
        } else if (showConfirmModal.type === "aiTutor") {
            purchaseAiTutor();
        } else if (showConfirmModal.type === "cbt") {
            purchaseCbt();
        }
        setShowConfirmModal(null);
    };

    const levels = [
        { level: 2, title: "초급 2", description: "일상생활 표현" },
        { level: 3, title: "중급 1", description: "한국 생활 정착" },
        { level: 4, title: "중급 2", description: "한국 사회와 문화" },
        { level: 5, title: "고급", description: "귀화 시험 대비" },
    ];

    const aiTutorDays = getAiTutorDaysRemaining();
    const cbtDays = getCbtDaysRemaining();

    return (
        <main className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-700 to-blue-800">
            {/* 헤더 */}
            <div className="max-w-5xl mx-auto px-4 py-6">
                <Link href="/study" className="text-white/80 hover:text-white">
                    ← 돌아가기
                </Link>
            </div>

            {/* 메인 콘텐츠 */}
            <div className="max-w-5xl mx-auto px-4 pb-16">
                {/* 타이틀 */}
                <div className="text-center mb-12">
                    <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-transparent bg-clip-text">
                        <h1 className="text-4xl font-extrabold mb-2">💎 프리미엄 스토어</h1>
                    </div>
                    <p className="text-xl text-blue-200">필요한 콘텐츠만 선택하여 구매하세요</p>
                </div>

                {/* 무료 안내 */}
                <div className="bg-green-500/20 border border-green-400/30 rounded-2xl p-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="text-4xl">🎁</div>
                        <div>
                            <h3 className="font-bold text-white text-lg">0단계 & 1단계 무료!</h3>
                            <p className="text-green-200">기초 한글과 초급 1단계는 무료로 학습할 수 있습니다.</p>
                        </div>
                    </div>
                </div>

                {/* 레벨별 구매 섹션 */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        📚 단계별 학습 패키지
                        <span className="text-sm font-normal text-blue-200">(영구 이용)</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {levels.map(({ level, title, description }) => {
                            const isPurchased = hasLevelAccess(level);
                            return (
                                <div
                                    key={level}
                                    className={`rounded-2xl p-6 ${isPurchased
                                            ? "bg-green-500/20 border border-green-400/30"
                                            : "bg-white/10 border border-white/20"
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="text-2xl mb-2">
                                                {level === 2 ? "📗" : level === 3 ? "📘" : level === 4 ? "📙" : "🎓"}
                                            </div>
                                            <h3 className="font-bold text-white text-lg">{level}단계 - {title}</h3>
                                            <p className="text-blue-200 text-sm">{description}</p>
                                        </div>
                                        {isPurchased && (
                                            <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full">
                                                구매완료
                                            </span>
                                        )}
                                    </div>
                                    <ul className="text-blue-200 text-sm space-y-1 mb-4">
                                        <li>✓ {level}단계 모든 어휘 ({level === 2 ? "300" : level === 3 ? "300" : level === 4 ? "250" : "200"}+ 단어)</li>
                                        <li>✓ 대화 예제</li>
                                        <li>✓ 단어장 퀴즈</li>
                                        <li>✓ 학습 통계</li>
                                    </ul>
                                    {isPurchased ? (
                                        <button
                                            disabled
                                            className="w-full py-3 bg-green-500/30 text-green-200 rounded-xl font-medium cursor-not-allowed"
                                        >
                                            ✓ 이용 가능
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setShowConfirmModal({ type: "level", level })}
                                            className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl font-bold hover:from-yellow-500 hover:to-orange-600 transition-all"
                                        >
                                            ₩9,900 구매하기
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 구독 서비스 섹션 */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        ⏰ 구독 서비스
                        <span className="text-sm font-normal text-blue-200">(30일 이용권)</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {/* AI 튜터 */}
                        <div
                            className={`rounded-2xl p-6 ${hasAiTutorAccess()
                                    ? "bg-blue-500/20 border border-blue-400/30"
                                    : "bg-white/10 border border-white/20"
                                }`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="text-4xl mb-2">🤖</div>
                                    <h3 className="font-bold text-white text-lg">AI 튜터</h3>
                                    <p className="text-blue-200 text-sm">1:1 맞춤형 학습 도우미</p>
                                </div>
                                {hasAiTutorAccess() && (
                                    <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full">
                                        D-{aiTutorDays}
                                    </span>
                                )}
                            </div>
                            <ul className="text-blue-200 text-sm space-y-1 mb-4">
                                <li>✓ 틀린 문제 상세 해설</li>
                                <li>✓ 한국 문화 배경 설명</li>
                                <li>✓ 실시간 질문 답변</li>
                                <li>✓ 맞춤형 학습 조언</li>
                            </ul>
                            {hasAiTutorAccess() ? (
                                <button
                                    onClick={() => setShowConfirmModal({ type: "aiTutor" })}
                                    className="w-full py-3 bg-blue-500/30 text-blue-200 rounded-xl font-medium hover:bg-blue-500/40 transition-all"
                                >
                                    30일 연장하기 ₩4,900
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowConfirmModal({ type: "aiTutor" })}
                                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-600 hover:to-indigo-700 transition-all"
                                >
                                    ₩4,900 / 30일
                                </button>
                            )}
                        </div>

                        {/* CBT 모의고사 */}
                        <div
                            className={`rounded-2xl p-6 ${hasCbtAccess()
                                    ? "bg-purple-500/20 border border-purple-400/30"
                                    : "bg-white/10 border border-white/20"
                                }`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="text-4xl mb-2">📝</div>
                                    <h3 className="font-bold text-white text-lg">CBT 모의고사</h3>
                                    <p className="text-blue-200 text-sm">실전 시험 완벽 대비</p>
                                </div>
                                {hasCbtAccess() && (
                                    <span className="bg-purple-500 text-white text-xs px-3 py-1 rounded-full">
                                        D-{cbtDays}
                                    </span>
                                )}
                            </div>
                            <ul className="text-blue-200 text-sm space-y-1 mb-4">
                                <li>✓ 실제 시험과 동일한 환경</li>
                                <li>✓ 문제 풀이 및 해설</li>
                                <li>✓ 오답 노트 자동 생성</li>
                                <li>✓ 점수 분석 리포트</li>
                            </ul>
                            {hasCbtAccess() ? (
                                <button
                                    onClick={() => setShowConfirmModal({ type: "cbt" })}
                                    className="w-full py-3 bg-purple-500/30 text-purple-200 rounded-xl font-medium hover:bg-purple-500/40 transition-all"
                                >
                                    30일 연장하기 ₩4,900
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowConfirmModal({ type: "cbt" })}
                                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-bold hover:from-purple-600 hover:to-pink-700 transition-all"
                                >
                                    ₩4,900 / 30일
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* 내 구매 현황 */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                    <h2 className="text-xl font-bold text-white mb-4">📋 내 구매 현황</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-white/5 rounded-xl">
                            <div className="text-2xl mb-2">📚</div>
                            <div className="text-white font-bold">{progress.purchasedLevels.length}/4</div>
                            <div className="text-blue-200 text-sm">구매한 레벨</div>
                        </div>
                        <div className="text-center p-4 bg-white/5 rounded-xl">
                            <div className="text-2xl mb-2">🤖</div>
                            <div className="text-white font-bold">
                                {hasAiTutorAccess() ? `D-${aiTutorDays}` : "미구매"}
                            </div>
                            <div className="text-blue-200 text-sm">AI 튜터</div>
                        </div>
                        <div className="text-center p-4 bg-white/5 rounded-xl">
                            <div className="text-2xl mb-2">📝</div>
                            <div className="text-white font-bold">
                                {hasCbtAccess() ? `D-${cbtDays}` : "미구매"}
                            </div>
                            <div className="text-blue-200 text-sm">CBT 모의고사</div>
                        </div>
                        <div className="text-center p-4 bg-white/5 rounded-xl">
                            <div className="text-2xl mb-2">🎓</div>
                            <div className="text-white font-bold">{progress.completedLevels.length}/6</div>
                            <div className="text-blue-200 text-sm">완료한 레벨</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 구매 확인 모달 */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6">
                        <div className="text-center mb-6">
                            <div className="text-5xl mb-4">
                                {showConfirmModal.type === "level" ? "📚" : showConfirmModal.type === "aiTutor" ? "🤖" : "📝"}
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">
                                {showConfirmModal.type === "level"
                                    ? `${showConfirmModal.level}단계 구매`
                                    : showConfirmModal.type === "aiTutor"
                                        ? "AI 튜터 구매"
                                        : "CBT 모의고사 구매"}
                            </h3>
                            <p className="text-gray-600">
                                {showConfirmModal.type === "level"
                                    ? "₩9,900 (영구 이용)"
                                    : "₩4,900 (30일)"}
                            </p>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                            <p className="text-yellow-800 text-sm text-center">
                                ⚠️ 현재 데모 버전입니다. 실제 결제는 진행되지 않습니다.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmModal(null)}
                                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
                            >
                                취소
                            </button>
                            <button
                                onClick={handlePurchase}
                                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700"
                            >
                                구매하기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
