"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            try {
                // Check active session
                const { data: { session } } = await supabase.auth.getSession();
                if (mounted) setUser(session?.user ?? null);
            } catch (error) {
                console.error("Auth initialization error:", error);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        initializeAuth();

        // Failsafe: 3초 뒤에는 무조건 로딩 끝냄 (Supabase 응답 없어도)
        const timer = setTimeout(() => {
            if (mounted) setIsLoading(false);
        }, 3000);

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) {
                setUser(session?.user ?? null);
                setIsLoading(false);
            }
        });

        return () => {
            mounted = false;
            clearTimeout(timer);
            subscription.unsubscribe();
        };
    }, [supabase.auth]);

    const logout = async () => {
        try {
            await supabase.auth.signOut();
            setUser(null);
            router.push("/login");
            router.refresh(); // Refresh to clear server-side cookies
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
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

