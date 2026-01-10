"use client";

import { createContext, useContext, useState } from "react";

interface SplashContextType {
    hasSeenSplash: boolean;
    setHasSeenSplash: (value: boolean) => void;
}

const SplashContext = createContext<SplashContextType | undefined>(undefined);

export function SplashProvider({ children }: { children: React.ReactNode }) {
    const [hasSeenSplash, setHasSeenSplash] = useState(false);

    return (
        <SplashContext.Provider value={{ hasSeenSplash, setHasSeenSplash }}>
            {children}
        </SplashContext.Provider>
    );
}

export function useSplash() {
    const context = useContext(SplashContext);
    if (context === undefined) {
        throw new Error("useSplash must be used within a SplashProvider");
    }
    return context;
}
