"use client";

import { useState } from "react";
import { useChat } from "ai/react";

interface AiTutorProps {
    question: string;
    selectedAnswer: string;
    correctAnswer: string;
    explanation: string;
    isPremium?: boolean;
    onClose: () => void;
}

export default function AiTutor({
    question,
    selectedAnswer,
    correctAnswer,
    explanation,
    isPremium = false,
    onClose,
}: AiTutorProps) {
    const [showAd, setShowAd] = useState(!isPremium);
    const [adWatched, setAdWatched] = useState(false);

    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        api: "/api/chat",
        body: {
            questionContext: {
                question,
                selectedAnswer,
                correctAnswer,
                explanation,
            },
        },
        initialMessages: [
            {
                id: "initial",
                role: "assistant",
                content: `안녕하세요! 저는 KIIP 전문 강사입니다. 🎓\n\n방금 틀린 문제에 대해 궁금한 점이 있으시면 무엇이든 물어보세요!\n\n예를 들어:\n- "왜 이 답이 틀렸나요?"\n- "이 개념을 더 자세히 설명해주세요"\n- "비슷한 문제가 나오면 어떻게 풀어야 하나요?"`,
            },
        ],
    });

    // 광고 시청 시뮬레이션
    const handleWatchAd = () => {
        setTimeout(() => {
            setAdWatched(true);
            setShowAd(false);
        }, 2000);
    };

    // 광고 화면
    if (showAd && !adWatched) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-6">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">🤖</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                            AI 튜터와 대화하기
                        </h3>
                        <p className="text-gray-600 mb-6">
                            광고를 시청하시면 AI 튜터와 대화할 수 있습니다.
                        </p>

                        {/* 광고 영역 */}
                        <div className="bg-gray-100 rounded-xl p-8 mb-6 text-gray-500">
                            <p className="text-sm">📢 광고 영역</p>
                            <p className="text-xs mt-1">이 광고 수익은 서비스 운영에 사용됩니다</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleWatchAd}
                                className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-medium"
                            >
                                광고 보기 (2초)
                            </button>
                        </div>

                        <p className="text-xs text-gray-400 mt-4">
                            💎 프리미엄 구독 시 광고 없이 무제한 이용 가능
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // 채팅 화면
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full h-[80vh] flex flex-col">
                {/* 헤더 */}
                <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                            <span className="text-xl">🤖</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">AI 튜터</h3>
                            <p className="text-xs text-gray-500">KIIP 전문 강사</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                    >
                        ✕
                    </button>
                </div>

                {/* 메시지 영역 */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[80%] p-3 rounded-2xl ${message.role === "user"
                                        ? "bg-blue-600 text-white rounded-br-none"
                                        : "bg-gray-100 text-gray-800 rounded-bl-none"
                                    }`}
                            >
                                <p className="whitespace-pre-wrap">{message.content}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-100 p-3 rounded-2xl rounded-bl-none">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 입력 영역 */}
                <form onSubmit={handleSubmit} className="p-4 border-t">
                    <div className="flex gap-2">
                        <input
                            value={input}
                            onChange={handleInputChange}
                            placeholder="질문을 입력하세요..."
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            전송
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
