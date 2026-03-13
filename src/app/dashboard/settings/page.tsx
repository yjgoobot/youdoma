"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Settings, Globe, Check } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/i18n/client";
import { CURRENCIES, getCurrencySymbol } from "@/lib/currency";

export default function SettingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { t } = useTranslation();
    const [currency, setCurrency] = useState("CNY");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        if (status === "authenticated") {
            fetch("/api/user/settings")
                .then((res) => res.json())
                .then((data) => {
                    setCurrency(data.currency || "CNY");
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [status]);

    const handleSave = async (newCurrency: string) => {
        setCurrency(newCurrency);
        setSaving(true);
        setSaved(false);
        try {
            const res = await fetch("/api/user/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currency: newCurrency }),
            });
            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            }
        } catch (error) {
            console.error("Failed to save settings:", error);
        } finally {
            setSaving(false);
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-950">
                <div className="flex items-center gap-3 text-gray-400">
                    <Globe className="h-6 w-6 animate-spin text-emerald-400" />
                    {t("common.loading")}
                </div>
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="min-h-screen bg-gray-950 pt-24 pb-12">
            <div className="mx-auto max-w-3xl px-6">
                <div className="mb-8 flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <Settings className="h-6 w-6 text-emerald-400" />
                            <h1 className="text-2xl font-bold text-white">{t("settings.title")}</h1>
                        </div>
                        <p className="text-sm text-gray-400">
                            {t("settings.subtitle")}
                        </p>
                    </div>
                </div>

                {/* Currency Setting */}
                <div className="glass-card rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-1">
                        {t("settings.currency_label")}
                    </h2>
                    <p className="text-sm text-gray-400 mb-6">
                        {t("settings.currency_desc")}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {CURRENCIES.map((code) => (
                            <button
                                key={code}
                                onClick={() => handleSave(code)}
                                disabled={saving}
                                className={`relative flex items-center gap-3 rounded-xl border p-4 transition-all ${currency === code
                                        ? "border-emerald-500/50 bg-emerald-500/10 text-white"
                                        : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:border-white/20"
                                    }`}
                            >
                                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-lg font-bold">
                                    {getCurrencySymbol(code)}
                                </span>
                                <span className="text-sm font-medium">
                                    {t(`settings.currency_${code}`)}
                                </span>
                                {currency === code && (
                                    <Check className="absolute right-3 top-3 h-4 w-4 text-emerald-400" />
                                )}
                            </button>
                        ))}
                    </div>

                    {saved && (
                        <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 text-sm text-emerald-400">
                            <Check className="h-4 w-4" />
                            {t("settings.save_success")}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
