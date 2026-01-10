"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
    { href: "/", icon: "🏠", label: "홈" },
    { href: "/study", icon: "📚", label: "학습" },
    { href: "/cbt", icon: "📝", label: "시험" },
    { href: "/analytics", icon: "👤", label: "내정보" },
];

export default function BottomNav() {
    const pathname = usePathname();

    // 네비게이션 바를 숨길 경로들
    const hiddenPaths = ["/login", "/signup", "/"];
    // 1. 명시적 숨김 경로
    if (hiddenPaths.includes(pathname)) {
        return null;
    }
    // 2. 학습 상세 페이지(/study/1 등)에서는 몰입을 위해 하단 탭 숨김
    if (pathname.startsWith("/study/")) {
        return null;
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 pb-[env(safe-area-inset-bottom)]">
            <div className="max-w-lg mx-auto flex items-center justify-around h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== "/" && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${isActive
                                ? "text-blue-600"
                                : "text-gray-400 hover:text-gray-600"
                                }`}
                        >
                            <span className="text-xl mb-0.5">{item.icon}</span>
                            <span className={`text-xs ${isActive ? "font-semibold" : ""}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
