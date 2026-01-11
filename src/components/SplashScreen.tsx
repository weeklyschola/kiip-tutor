"use client";

import { useState, useEffect } from "react";

interface SplashScreenProps {
    onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const slides = [
        {
            emoji: "📖",
            title: "KIIP 튜터",
            subtitle: "KIIP 완벽 대비",
            description: "한국 생활 적응과 영주권, 귀화를 위한\n체계적인 학습 도우미",
            bg: "from-blue-500 to-blue-600",
        },
        {
            emoji: "📚",
            title: "단계별 학습",
            subtitle: "0단계부터 5단계까지",
            description: "기초부터 심화까지\n나에게 맞는 레벨로 학습하세요",
            bg: "from-indigo-500 to-purple-600",
        },
        {
            emoji: "🎯",
            title: "실전 연습",
            subtitle: "CBT 모의고사 & 단어 연습",
            description: "실제 시험과 동일한 환경에서\n문제를 풀어보세요",
            bg: "from-purple-500 to-pink-600",
        },
        {
            emoji: "🤖",
            title: "AI 튜터",
            subtitle: "24시간 질문 가능",
            description: "문법, 문화, 무엇이든\nAI에게 물어보세요",
            bg: "from-green-500 to-teal-600",
        },
    ];

    const nextSlide = () => {
        if (isAnimating) return;

        if (currentSlide < slides.length - 1) {
            setIsAnimating(true);
            setCurrentSlide(prev => prev + 1);
            setTimeout(() => setIsAnimating(false), 300);
        } else {
            handleComplete();
        }
    };

    const prevSlide = () => {
        if (isAnimating || currentSlide === 0) return;
        setIsAnimating(true);
        setCurrentSlide(prev => prev - 1);
        setTimeout(() => setIsAnimating(false), 300);
    };

    const handleComplete = () => {
        // localStorage.setItem("kiip_onboarding_complete", "true"); // 항상 표시를 위해 제거
        onComplete();
    };

    const handleSkip = () => {
        onComplete();
    };

    return (
        <div className={`fixed inset-0 z-[100] bg-gradient-to-br ${slides[currentSlide].bg} transition-all duration-500`}>
            {/* Skip 버튼 */}
            <button
                onClick={handleSkip}
                className="absolute top-6 right-6 text-white/70 hover:text-white text-sm font-medium z-10"
            >
                건너뛰기
            </button>

            {/* 슬라이드 내용 */}
            <div className="h-full flex flex-col items-center justify-center px-8 text-center">
                <div
                    className={`transition-all duration-300 ${isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
                >
                    {/* 아이콘 */}
                    <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                        <span className="text-6xl">{slides[currentSlide].emoji}</span>
                    </div>

                    {/* 텍스트 */}
                    <h1 className="text-3xl font-bold text-white mb-2">
                        {slides[currentSlide].title}
                    </h1>
                    <h2 className="text-lg font-medium text-white/80 mb-4">
                        {slides[currentSlide].subtitle}
                    </h2>
                    <p className="text-white/70 whitespace-pre-line leading-relaxed max-w-xs mx-auto">
                        {slides[currentSlide].description}
                    </p>
                </div>
            </div>

            {/* 하단 네비게이션 */}
            <div className="absolute bottom-0 left-0 right-0 p-8">
                {/* 인디케이터 */}
                <div className="flex justify-center gap-2 mb-6">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                if (!isAnimating) {
                                    setIsAnimating(true);
                                    setCurrentSlide(index);
                                    setTimeout(() => setIsAnimating(false), 300);
                                }
                            }}
                            className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide
                                ? "w-8 bg-white"
                                : "w-2 bg-white/40 hover:bg-white/60"
                                }`}
                        />
                    ))}
                </div>

                {/* 버튼 */}
                <div className="flex gap-4 max-w-sm mx-auto">
                    {currentSlide > 0 && (
                        <button
                            onClick={prevSlide}
                            className="flex-1 py-4 bg-white/20 backdrop-blur-sm text-white rounded-2xl font-semibold hover:bg-white/30 transition-colors"
                        >
                            이전
                        </button>
                    )}
                    <button
                        onClick={nextSlide}
                        className={`${currentSlide === 0 ? "w-full" : "flex-1"} py-4 bg-white text-gray-800 rounded-2xl font-bold hover:bg-white/90 transition-colors shadow-lg`}
                    >
                        {currentSlide === slides.length - 1 ? "시작하기 🚀" : "다음"}
                    </button>
                </div>
            </div>
        </div>
    );
}
