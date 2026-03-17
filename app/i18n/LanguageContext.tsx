"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import en from "../messages/en.json";
import it from "../messages/it.json";
import es from "../messages/es.json";
import fr from "../messages/fr.json";
import de from "../messages/de.json";

type LanguageKey = "en" | "it" | "es" | "fr" | "de";

const dictionaries: Record<LanguageKey, any> = { en, it, es, fr, de };

interface LanguageContextProps {
    lang: LanguageKey;
    setLang: (lang: LanguageKey) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [lang, setLangState] = useState<LanguageKey>("en");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Check local storage on mount
        const saved = localStorage.getItem("skillion-language") as LanguageKey;
        if (saved && dictionaries[saved]) {
            setLangState(saved);
        }
        setMounted(true);
    }, []);

    const setLang = (newLang: LanguageKey) => {
        if (dictionaries[newLang]) {
            setLangState(newLang);
            localStorage.setItem("skillion-language", newLang);
            document.documentElement.lang = newLang; // update html lang attribute
        }
    };

    // Safe dot notation accessor (e.g. "hero.title1")
    const t = (path: string): string => {
        return path.split('.').reduce((obj, key) => (obj && obj[key] !== 'undefined' ? obj[key] : path), dictionaries[lang]);
    };

    // Prevent hydration mismatch by rendering default until mounted
    // (Alternatively, strictly render everything from context. Since it's client-side context, 
    // Next.js server will pre-render with default "en". We must ensure server and initial client match).

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useTranslation must be used within a LanguageProvider");
    }
    return context;
}
