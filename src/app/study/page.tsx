"use client";

import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import ProgressBar from "@/components/ProgressBar";

// 레벨 데이터
const levels = [
    {
        level: 0,
        title: "기초",
        description: "한글의 기초와 일상생활에 꼭 필요한 기본 인사를 배웁니다.",
        icon: "💬",
        status: "completed",
        progress: 100,
    },
    {
        level: 1,
        title: "초급 1",
        description: "간단한 쇼핑, 병원 방문 등 기초적인 의사소통 능력을 기릅니다.",
        icon: "💭",
        status: "in-progress",
        progress: 45,
    },
    {
        level: 2,
        title: "초급 2",
        description: "친숙한 주제에 대한 이해와 기초적인 한국 문화에 대해 배웁니다.",
        icon: "💬",
        status: "locked",
        progress: 0,
    },
    {
        level: 3,
        title: "중급 1",
        description: "일상적인 사회생활과 공공시설 이용에 필요한 문법을 익힙니다.",
        icon: "💬",
        status: "locked",
        progress: 0,
    },
    {
        level: 4,
        title: "중급 2",
        description: "사회적 이슈 및 전문적인 한국에서의 유창한 의사소통을 지향합니다.",
        icon: "📄",
        status: "locked",
        progress: 0,
    },
    {
        level: 5,
        title: "한국사회 이해",
        description: "한국의 역사, 사회 제도 및 법률 체계에 대한 심도 있는 이해를 돕습니다.",
        icon: "📄",
        status: "locked",
        progress: 0,
    },
];

export default function StudyPage() {
    return (
        <main className="min-h-screen bg-gray-50 pb-nav">
            {/* 헤더 */}
            <header className="bg-white sticky top-0 z-40 border-b border-gray-100">
                <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">📚</span>
                        <div>
                            <h1 className="font-bold text-gray-800">단계 선택하기</h1>
                            <p className="text-xs text-gray-500">사회통합프로그램 (KIIP)</p>
                        </div>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-full">
                        <span className="text-xl">⚙️</span>
                    </button>
                </div>
            </header>

            <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
                {levels.map((level, index) => {
                    const isLocked = level.status === "locked";
                    const isCompleted = level.status === "completed";
                    const isInProgress = level.status === "in-progress";

                    return (
                        <Link
                            key={level.level}
                            href={isLocked ? "#" : `/study/${level.level}`}
                            className={`block bg-white rounded-2xl p-5 shadow-sm transition-all ${isLocked
                                    ? "opacity-60 cursor-not-allowed"
                                    : "hover:shadow-md hover:-translate-y-0.5"
                                } ${isInProgress ? "ring-2 ring-blue-500 ring-offset-2" : ""}`}
                            onClick={(e) => isLocked && e.preventDefault()}
                        >
                            <div className="flex items-start gap-4">
                                {/* 아이콘 */}
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isCompleted ? "bg-green-100" :
                                        isInProgress ? "bg-blue-100" :
                                            "bg-gray-100"
                                    }`}>
                                    {isLocked ? (
                                        <span className="text-xl text-gray-400">🔒</span>
                                    ) : (
                                        <span className="text-xl">{level.icon}</span>
                                    )}
                                </div>

                                {/* 내용 */}
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h2 className={`font-bold ${isLocked ? "text-gray-400" : "text-gray-800"}`}>
                                            {level.level}단계: {level.title}
                                        </h2>

                                        {/* 상태 배지 */}
                                        {isCompleted && (
                                            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                                                학습 완료
                                            </span>
                                        )}
                                        {isInProgress && (
                                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                                                학습 중 {level.progress}%
                                            </span>
                                        )}
                                        {isLocked && (
                                            <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">
                                                시작 전
                                            </span>
                                        )}
                                    </div>

                                    <p className={`text-sm mb-3 ${isLocked ? "text-gray-400" : "text-gray-600"}`}>
                                        {level.description}
                                    </p>

                                    {/* 진행률 바 */}
                                    {!isLocked && (
                                        <ProgressBar
                                            value={level.progress}
                                            size="sm"
                                            color={isCompleted ? "success" : "primary"}
                                        />
                                    )}
                                </div>
                            </div>
                        </Link>
                    );
                })}

                {/* 학습 계속하기 버튼 */}
                <div className="pt-4">
                    <Link
                        href="/study/1"
                        className="block w-full py-4 bg-blue-600 text-white text-center rounded-2xl font-semibold hover:bg-blue-700 transition-colors shadow-lg"
                    >
                        학습 계속하기
                    </Link>
                </div>
            </div>

            <BottomNav />
        </main>
    );
}
