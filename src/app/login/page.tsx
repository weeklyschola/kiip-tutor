"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, Suspense } from "react";

export const dynamic = 'force-dynamic';

function LoginContent() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter(); // Use imported router if needed, though OAuth redirects are handled by Supabase

    const handleLogin = async (provider: 'google' | 'kakao' | 'naver' | 'apple') => {
        try {
            setIsLoading(true);
            const supabase = createClient();
            const { error } = await supabase.auth.signInWithOAuth({
                provider: provider as any, // 'naver' might not be in the strict Supabase types yet depending on version
                options: {
                    redirectTo: `${location.origin}/auth/callback`,
                },
            });

            if (error) {
                console.error("Login Error:", error);
                alert("로그인 중 오류가 발생했습니다: " + error.message);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-8">
                {/* 헤더 */}
                <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <h1 className="text-4xl font-bold text-blue-600">🇰🇷 KIIP 튜터</h1>
                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded">BETA</span>
                    </div>
                    <p className="text-gray-500">소셜 계정으로 간편하게 시작하세요</p>
                </div>

                {/* 소셜 로그인 버튼 목록 */}
                <div className="space-y-3">
                    <button
                        onClick={() => handleLogin('google')}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors bg-white text-gray-700 font-medium"
                    >
                        {/* Google Icon */}
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Google로 계속하기
                    </button>
                </div>

                <div className="text-center mt-6">
                    <p className="text-xs text-gray-400 mb-4">
                        계속 진행하면 서비스 이용약관 및 개인정보 처리방침에 동의하는 것으로 간주됩니다.
                    </p>
                    <a href="/" className="text-blue-600 hover:underline text-sm font-medium">
                        ← 메인으로 돌아가기
                    </a>
                </div>
            </div>
        </main>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-blue-600">
                <span className="text-white animate-pulse">Loading Login...</span>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
