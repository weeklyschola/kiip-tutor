"use client";

import { useEffect } from "react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Global App Error:", error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-6 text-center">
            <h2 className="text-3xl font-bold text-red-600 mb-4">앱 오류 발생</h2>
            <p className="text-gray-600 mb-6">죄송합니다. 예기치 않은 오류가 발생했습니다.</p>

            <div className="bg-white p-4 rounded-lg border border-red-200 shadow-sm max-w-lg w-full mb-8 overflow-auto max-h-60 text-left">
                <p className="font-mono text-sm text-red-500 break-all">{error.message}</p>
                {error.digest && <p className="text-xs text-slate-400 mt-2">Error Digest: {error.digest}</p>}
            </div>

            <div className="flex gap-4">
                <button
                    onClick={() => reset()}
                    className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg"
                >
                    다시 시도
                </button>
                <button
                    onClick={() => window.location.href = '/'}
                    className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-sm"
                >
                    홈으로 가기
                </button>
            </div>
        </div>
    );
}
