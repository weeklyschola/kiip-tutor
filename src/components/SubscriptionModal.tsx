"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // 모달 오픈 시 스크롤 방지
        if (isOpen) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "unset";

        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* 배경 오버레이 */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* 모달 컨텐츠 */}
            <div className="relative bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-up">
                {/* 상단 장식 및 닫기 버튼 */}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-center relative overflow-hidden">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/70 hover:text-white"
                    >
                        ✕
                    </button>
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                            <span className="text-3xl">👑</span>
                        </div>
                        <h2 className="text-xl font-bold text-white">Premium 멤버십</h2>
                        <p className="text-indigo-100 text-sm mt-1">합격을 위한 최고의 선택</p>
                    </div>
                    {/* 배경 효과 */}
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-20 transform scale-150" />
                </div>

                <div className="p-6">
                    <h3 className="font-bold text-gray-800 mb-4 text-center">
                        모든 학습 기능을 잠금 해제하세요!
                    </h3>

                    <ul className="space-y-3 mb-6">
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-green-600 text-xs">✓</span>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-800 text-sm">모든 레벨 단어장 이용</h4>
                                <p className="text-xs text-gray-500">2~5단계 포함 전체 접근 가능</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-green-600 text-xs">✓</span>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-800 text-sm">무제한 AI 튜터</h4>
                                <p className="text-xs text-gray-500">24시간 언제든 물어보세요</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-green-600 text-xs">✓</span>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-800 text-sm">광고 없는 학습</h4>
                                <p className="text-xs text-gray-500">집중력 100% 환경 제공</p>
                            </div>
                        </li>
                    </ul>

                    {/* 가격 정보 */}
                    <div className="bg-gray-50 rounded-xl p-4 text-center mb-6 border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">지금 구독하면</p>
                        <div className="flex items-baseline justify-center gap-1">
                            <span className="text-2xl font-bold text-gray-900">4,900원</span>
                            <span className="text-sm text-gray-500">/ 월</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Link
                            href="/subscription"
                            onClick={onClose}
                            className="block w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3.5 rounded-xl text-center shadow-lg shadow-indigo-200 hover:shadow-xl hover:scale-[1.02] transition-all"
                        >
                            지금 시작하기 🚀
                        </Link>
                        <button
                            onClick={onClose}
                            className="block w-full text-gray-400 text-sm font-medium hover:text-gray-600"
                        >
                            괜찮아요, 다음에 할게요
                        </button>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes scale-up {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-scale-up {
                    animation: scale-up 0.2s ease-out forwards;
                }
            `}</style>
        </div>,
        document.body
    );
}
