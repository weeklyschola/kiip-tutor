"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        user_id: "",
        password: "",
    });

    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.user_id || !formData.password) {
            setError("아이디와 비밀번호를 입력해주세요.");
            return;
        }

        setIsLoading(true);
        setError("");

        const result = await login(formData.user_id, formData.password);

        setIsLoading(false);

        if (result.success) {
            router.push("/study");
        } else {
            setError(result.error || "로그인에 실패했습니다.");
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* 헤더 */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <h1 className="text-4xl font-bold text-white">🇰🇷 KIIP 튜터</h1>
                        <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded backdrop-blur-sm">BETA</span>
                    </div>
                    <p className="text-blue-200">사회통합프로그램 학습의 스마트한 동반자</p>
                </div>

                {/* 로그인 폼 */}
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
                    <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">로그인</h2>

                    {/* 아이디 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">아이디</label>
                        <input
                            type="text"
                            name="user_id"
                            value={formData.user_id}
                            onChange={handleChange}
                            placeholder="아이디를 입력하세요"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* 비밀번호 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="비밀번호를 입력하세요"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* 에러 메시지 */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {/* 로그인 버튼 */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "로그인 중..." : "로그인"}
                    </button>

                    {/* 회원가입 링크 */}
                    <p className="text-center text-gray-600 text-sm">
                        계정이 없으신가요?{" "}
                        <Link href="/signup" className="text-blue-600 font-medium hover:underline">
                            회원가입
                        </Link>
                    </p>
                </form>

                {/* 홈으로 돌아가기 */}
                <div className="text-center mt-6">
                    <Link href="/" className="text-blue-200 hover:text-white text-sm">
                        ← 홈으로 돌아가기
                    </Link>
                </div>
            </div>
        </main>
    );
}
