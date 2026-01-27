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
        console.error("Study Page Error:", error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-6">
            <h2 className="text-2xl font-bold text-red-600 mb-4">문제가 발생했습니다.</h2>
            <div className="bg-white p-4 rounded-lg border border-red-200 shadow-sm max-w-lg w-full mb-6 overflow-auto max-h-60">
                <p className="font-mono text-sm text-red-500 break-all">{error.message}</p>
                {error.digest && <p className="text-xs text-slate-400 mt-2">Error Digest: {error.digest}</p>}
            </div>
            <button
                onClick={() => reset()}
                className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
            >
                다시 시도하기
            </button>
            <button
                onClick={() => window.location.href = '/study'}
                className="mt-4 text-slate-500 hover:text-slate-700 underline"
            >
                목록으로 돌아가기
            </button>
        </div>
    );
}
