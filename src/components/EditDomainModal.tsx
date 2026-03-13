"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2, DollarSign } from "lucide-react";
import { useTranslation } from "@/i18n/client";
import { CURRENCIES, getCurrencySymbol } from "@/lib/currency";

interface EditDomainModalProps {
    isOpen: boolean;
    onClose: () => void;
    domainId: string;
    domainName: string;
    currentCurrency: string | null;
    currentCustomPrice: number | null;
    userCurrency: string;
    onSaved: (updated: any) => void;
}

export default function EditDomainModal({
    isOpen,
    onClose,
    domainId,
    domainName,
    currentCurrency,
    currentCustomPrice,
    userCurrency,
    onSaved,
}: EditDomainModalProps) {
    const { t } = useTranslation();
    const [currency, setCurrency] = useState(currentCurrency || "");
    const [customPrice, setCustomPrice] = useState(
        currentCustomPrice != null ? currentCustomPrice.toString() : ""
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        setCurrency(currentCurrency || "");
        setCustomPrice(currentCustomPrice != null ? currentCustomPrice.toString() : "");
    }, [currentCurrency, currentCustomPrice, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSaving(true);

        try {
            const res = await fetch(`/api/domains/${domainId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currency: currency || null,
                    customPrice: customPrice ? parseFloat(customPrice) : null,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || t("domain_edit.save_error"));
            }

            const updated = await res.json();
            onSaved(updated);
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative w-full max-w-md glass-card rounded-2xl p-8 mx-6">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                    <X className="h-5 w-5" />
                </button>

                <h2 className="mb-1 text-xl font-bold text-white">{t("domain_edit.title")}</h2>
                <p className="mb-6 text-sm text-gray-400">{domainName}</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Custom Price */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">
                            {t("domain_edit.custom_price")}
                        </label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                <DollarSign className="h-4 w-4" />
                            </div>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={customPrice}
                                onChange={(e) => setCustomPrice(e.target.value)}
                                className="w-full rounded-xl bg-white/5 py-2.5 pl-10 pr-4 text-white placeholder-gray-500 outline-none border border-white/10 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                placeholder={t("domain_edit.custom_price_placeholder")}
                            />
                        </div>
                    </div>

                    {/* Currency */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">
                            {t("domain_edit.currency")}
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setCurrency("")}
                                className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-sm transition-all ${currency === ""
                                        ? "border-emerald-500/50 bg-emerald-500/10 text-white"
                                        : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10"
                                    }`}
                            >
                                {t("settings.use_default")}
                                <span className="text-gray-500 text-xs">({getCurrencySymbol(userCurrency)})</span>
                            </button>
                            {CURRENCIES.map((code) => (
                                <button
                                    key={code}
                                    type="button"
                                    onClick={() => setCurrency(code)}
                                    className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-sm transition-all ${currency === code
                                            ? "border-emerald-500/50 bg-emerald-500/10 text-white"
                                            : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10"
                                        }`}
                                >
                                    <span className="font-bold">{getCurrencySymbol(code)}</span>
                                    {code}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5"
                        >
                            {t("domain_edit.cancel")}
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-500/25 transition-all hover:shadow-green-500/40 hover:brightness-110 disabled:opacity-50"
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            {t("domain_edit.save")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
