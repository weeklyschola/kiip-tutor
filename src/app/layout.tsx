import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProgressProvider } from "@/contexts/ProgressContext";
import { SplashProvider } from "@/contexts/SplashContext";
import BottomNav from "@/components/BottomNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "KIIP 튜터 - 사회통합프로그램 학습",
    description: "KIIP 사전평가 및 본평가 대비 CBT 연습과 1:1 AI 튜터 학습",
    keywords: ["KIIP", "사회통합프로그램", "한국어", "귀화시험", "CBT"],
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "KIIP Tutor",
    },
};

export const viewport: Viewport = {
    themeColor: "#3B82F6",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko">
            <body className={inter.className}>
                <SplashProvider>
                    <AuthProvider>
                        <ProgressProvider>
                            {children}
                            <BottomNav />
                        </ProgressProvider>
                    </AuthProvider>
                </SplashProvider>
            </body>
        </html>
    );
}

