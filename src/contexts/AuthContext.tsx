"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface User {
    id: string;
    user_id: string; // 로그인 ID
    nickname: string;
    birth_date: string;
    gender: string;
    nationality: string;
    created_at: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (userId: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signup: (userData: SignupData) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    isAuthenticated: boolean;
}

export interface SignupData {
    user_id: string;
    password: string;
    nickname: string;
    birth_date: string;
    gender: string;
    nationality: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // 앱 시작 시 저장된 세션 확인
    useEffect(() => {
        const savedUser = localStorage.getItem("kiip_user");
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch {
                localStorage.removeItem("kiip_user");
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (userId: string, password: string) => {
        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: userId, password }),
            });

            const data = await response.json();

            if (data.success && data.user) {
                setUser(data.user);
                localStorage.setItem("kiip_user", JSON.stringify(data.user));
                return { success: true };
            }

            return { success: false, error: data.error || "로그인에 실패했습니다." };
        } catch {
            return { success: false, error: "서버 연결에 실패했습니다." };
        }
    };

    const signup = async (userData: SignupData) => {
        try {
            const response = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData),
            });

            const data = await response.json();

            if (data.success && data.user) {
                setUser(data.user);
                localStorage.setItem("kiip_user", JSON.stringify(data.user));
                return { success: true };
            }

            return { success: false, error: data.error || "회원가입에 실패했습니다." };
        } catch {
            return { success: false, error: "서버 연결에 실패했습니다." };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("kiip_user");
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                login,
                signup,
                logout,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
