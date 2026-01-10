"use client";

import Link from "next/link";
import BottomNav from "@/components/BottomNav";

export default function SubscriptionPage() {
    return (
        <main className="min-h-screen bg-gray-50 pb-nav">
            <header className="bg-white sticky top-0 z-40 border-b border-gray-100">
                <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="text-gray-600">
                        <span className="text-xl">←</span>
                    </Link>
                    <h1 className="font-bold text-gray-800">멤버십 구독</h1>
                    <div className="w-6" />
                </div>
            </header>

            <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
                {/* 헤더 섹션 */}
                <div className="text-center py-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce-slow">
                        <span className="text-4xl">👑</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">KIIP Tutor Premium</h2>
                    <p className="text-gray-600">합격을 위한 가장 확실한 방법</p>
                </div>

                {/* 가격 정보 */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-indigo-100 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                        SPECIAL OFFER
                    </div>
                    <p className="text-sm text-gray-500 mb-2">월간 이용권</p>
                    <div className="flex items-baseline justify-center gap-1 mb-4">
                        <span className="text-4xl font-bold text-gray-900">4,900원</span>
                        <span className="text-gray-500">/ 월</span>
                    </div>
                    <p className="text-xs text-indigo-600 font-medium bg-indigo-50 px-3 py-1 rounded-full inline-block">
                        하루 160원으로 모든 기능 이용 가능
                    </p>
                </div>

                {/* 혜택 리스트 */}
                <div className="space-y-4">
                    <h3 className="font-bold text-gray-800 px-2">Premium 혜택</h3>

                    <div className="bg-white rounded-2xl p-5 shadow-sm flex items-start gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                            <span className="text-xl">📚</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800">모든 단계 단어장 잠금 해제</h4>
                            <p className="text-sm text-gray-500 mt-1">2~5단계 필수 어휘와 예문을 제한 없이 학습하세요.</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-sm flex items-start gap-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                            <span className="text-xl">🤖</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800">무제한 AI 튜터 질문</h4>
                            <p className="text-sm text-gray-500 mt-1">궁금한 문법, 문화 내용을 AI에게 언제든지 물어보세요.</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-sm flex items-start gap-4">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                            <span className="text-xl">🎯</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800">실전 모의고사 전체 해설</h4>
                            <p className="text-sm text-gray-500 mt-1">틀린 문제에 대한 상세한 해설과 오답 노트를 제공합니다.</p>
                        </div>
                    </div>
                </div>

                {/* 하단 버튼 */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-8 z-50">
                    <div className="max-w-lg mx-auto">
                        <button
                            onClick={() => alert("현재 결제 시스템 점검 중입니다.\n관리자에게 문의해 주세요. (weeklyschola@gmail.com)")}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl hover:scale-[1.02] transition-all"
                        >
                            4,900원에 시작하기
                        </button>
                        <p className="text-center text-xs text-gray-400 mt-3">
                            언제든지 해지 가능합니다.
                        </p>
                    </div>
                </div>
                <div className="h-24" /> {/* 하단 여백 확보 */}
            </div>
        </main>
    );
}
