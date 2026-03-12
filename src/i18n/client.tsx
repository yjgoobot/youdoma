"use client";

import React, { createContext, useContext, ReactNode } from "react";
import type { Locale } from "./server";

type Dictionary = Record<string, any>;

interface I18nContextProps {
    locale: Locale;
    dictionary: Dictionary;
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined);

export function I18nProvider({
    children,
    locale,
    dictionary,
}: {
    children: ReactNode;
    locale: Locale;
    dictionary: Dictionary;
}) {
    return (
        <I18nContext.Provider value={{ locale, dictionary }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error("useTranslation must be used within an I18nProvider");
    }

    const { dictionary, locale } = context;

    // Simple key resolver: useTranslation()("home.title")
    const t = (keyStr: string, params?: Record<string, string | number>) => {
        const keys = keyStr.split(".");
        let value = dictionary;
        for (const key of keys) {
            if (value[key] === undefined) {
                console.warn(`Translation key not found: ${keyStr}`);
                return keyStr;
            }
            value = value[key];
        }

        let result = String(value);

        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                result = result.replace(new RegExp(`{{${k}}}`, "g"), String(v));
            });
        }

        return result;
    };

    return { t, locale, dictionary };
}
