"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/client";
import { Globe } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function LanguageSwitcher() {
    const { locale } = useTranslation();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const switchLanguage = (newLocale: string) => {
        document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
        setIsOpen(false);
        router.refresh();
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
            >
                <Globe className="h-4 w-4" />
                <span className="uppercase">{locale}</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-1 flex w-32 flex-col overflow-hidden rounded-xl border border-white/10 bg-gray-900 shadow-xl z-50">
                    <button
                        onClick={() => switchLanguage("en")}
                        className={`px-4 py-2 text-left text-sm transition-colors hover:bg-white/5 ${locale === "en" ? "text-emerald-400 font-medium bg-emerald-500/10" : "text-gray-300"}`}
                    >
                        English
                    </button>
                    <button
                        onClick={() => switchLanguage("zh")}
                        className={`px-4 py-2 text-left text-sm transition-colors hover:bg-white/5 ${locale === "zh" ? "text-emerald-400 font-medium bg-emerald-500/10" : "text-gray-300"}`}
                    >
                        中文
                    </button>
                    <button
                        onClick={() => switchLanguage("ja")}
                        className={`px-4 py-2 text-left text-sm transition-colors hover:bg-white/5 ${locale === "ja" ? "text-emerald-400 font-medium bg-emerald-500/10" : "text-gray-300"}`}
                    >
                        日本語
                    </button>
                </div>
            )}
        </div>
    );
}
