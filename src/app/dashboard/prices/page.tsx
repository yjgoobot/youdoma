"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2, Tag, Building2, Globe, DollarSign, Plus, Pencil, X } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/i18n/client";
import { CURRENCIES, getCurrencySymbol } from "@/lib/currency";

interface DomainPrice {
    id: string;
    registrar: string;
    tld: string;
    price: number;
    currency: string | null;
}

export default function PricesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { t } = useTranslation();
    const [prices, setPrices] = useState<DomainPrice[]>([]);
    const [registrars, setRegistrars] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [userCurrency, setUserCurrency] = useState("CNY");

    const [registrar, setRegistrar] = useState("");
    const [tld, setTld] = useState("");
    const [price, setPrice] = useState("");
    const [currency, setCurrency] = useState("");
    const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [pricesRes, domainsRes, settingsRes] = await Promise.all([
                fetch("/api/prices"),
                fetch("/api/domains"),
                fetch("/api/user/settings")
            ]);

            if (pricesRes.ok) {
                const data = await pricesRes.json();
                setPrices(data);
            }
            if (domainsRes.ok) {
                const data = await domainsRes.json();
                const uniqueRegistrars = Array.from(
                    new Set(data.map((d: any) => d.registrar).filter(Boolean))
                ) as string[];
                setRegistrars(uniqueRegistrars);
            }
            if (settingsRes.ok) {
                const data = await settingsRes.json();
                setUserCurrency(data.currency || "CNY");
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status === "authenticated") {
            fetchData();
        }
    }, [status, fetchData]);

    const resetForm = () => {
        setEditingPriceId(null);
        setRegistrar("");
        setTld("");
        setPrice("");
        setCurrency("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!registrar || !tld || !price) {
            setError(t("prices.error_incomplete"));
            return;
        }

        const formattedTld = tld.startsWith(".") ? tld : `.${tld}`;

        try {
            setIsSubmitting(true);
            const res = await fetch("/api/prices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    registrar,
                    tld: formattedTld,
                    price: parseFloat(price),
                    currency: currency || null,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || t("common.error"));

            resetForm();
            await fetchData();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (item: DomainPrice) => {
        setEditingPriceId(item.id);
        setRegistrar(item.registrar);
        setTld(item.tld);
        setPrice(item.price.toString());
        setCurrency(item.currency || "");
        setError("");
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t("prices.delete_confirm"))) return;

        try {
            const res = await fetch(`/api/prices?id=${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setPrices(prices.filter(p => p.id !== id));
            } else {
                const data = await res.json();
                alert(data.error || t("prices.delete_error"));
            }
        } catch (error) {
            console.error("Failed to delete price:", error);
            alert(t("prices.delete_error"));
        }
    };

    if (status === "loading") {
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
            <div className="mx-auto max-w-5xl px-6">
                <div className="mb-8 flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <Tag className="h-6 w-6 text-emerald-400" />
                            <h1 className="text-2xl font-bold text-white">{t("prices.title")}</h1>
                        </div>
                        <p className="text-sm text-gray-400">
                            {t("prices.subtitle")}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Add Form */}
                    <div className="md:col-span-1 space-y-4">
                        <div className="glass-card rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Plus className="h-5 w-5 text-emerald-400" />
                                {editingPriceId ? t("prices.edit_rule") : t("prices.add_rule")}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
                                        {error}
                                    </div>
                                )}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-300">
                                        {t("prices.registrar_label")}
                                    </label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                            <Building2 className="h-4 w-4" />
                                        </div>
                                        <input
                                            type="text"
                                            list="registrar-options"
                                            value={registrar}
                                            onChange={(e) => setRegistrar(e.target.value)}
                                            className="w-full rounded-xl bg-white/5 py-2.5 pl-10 pr-4 text-white placeholder-gray-500 outline-none border border-white/10 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                            placeholder={t("prices.registrar_placeholder")}
                                            required
                                        />
                                        <datalist id="registrar-options">
                                            <option value="全部" label={t("prices.all_registrars")} />
                                            {registrars.map((r, i) => (
                                                <option key={i} value={r} />
                                            ))}
                                        </datalist>
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-300">
                                        {t("prices.tld_label")}
                                    </label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                            <Globe className="h-4 w-4" />
                                        </div>
                                        <input
                                            type="text"
                                            value={tld}
                                            onChange={(e) => setTld(e.target.value)}
                                            className="w-full rounded-xl bg-white/5 py-2.5 pl-10 pr-4 text-white placeholder-gray-500 outline-none border border-white/10 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                            placeholder={t("prices.tld_placeholder")}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-300">
                                        {t("prices.price_label")}
                                    </label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                            <DollarSign className="h-4 w-4" />
                                        </div>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                            className="w-full rounded-xl bg-white/5 py-2.5 pl-10 pr-4 text-white placeholder-gray-500 outline-none border border-white/10 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                            placeholder={t("prices.price_placeholder")}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-300">
                                        {t("prices.currency_label")}
                                    </label>
                                    <select
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}
                                        className="w-full rounded-xl bg-white/5 py-2.5 px-4 text-white outline-none border border-white/10 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                    >
                                        <option value="" className="bg-gray-900 text-gray-200">
                                            {t("settings.use_default")} ({userCurrency})
                                        </option>
                                        {CURRENCIES.map((code) => (
                                            <option key={code} value={code} className="bg-gray-900 text-gray-200">
                                                {getCurrencySymbol(code)} {code}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-600 disabled:opacity-50 mt-4"
                                >
                                    {isSubmitting ? (
                                        <Globe className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    {editingPriceId ? t("prices.update_rule") : t("prices.save_rule")}
                                </button>
                                {editingPriceId && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 py-2.5 text-sm font-semibold text-gray-200 border border-white/10 transition-all hover:bg-white/10"
                                    >
                                        <X className="h-4 w-4" />
                                        {t("prices.cancel_edit")}
                                    </button>
                                )}
                            </form>
                        </div>
                    </div>

                    {/* Rules List */}
                    <div className="md:col-span-2 space-y-4">
                        {loading ? (
                            <div className="flex h-32 items-center justify-center glass-card rounded-xl">
                                <span className="flex items-center gap-2 text-gray-400">
                                    <Globe className="h-5 w-5 animate-spin" />
                                    {t("common.loading")}
                                </span>
                            </div>
                        ) : prices.length === 0 ? (
                            <div className="flex h-32 flex-col items-center justify-center glass-card rounded-xl text-center p-6">
                                <Tag className="h-8 w-8 text-gray-600 mb-3" />
                                <p className="text-gray-400">{t("prices.no_rules")}</p>
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-xl border border-white/5">
                                <table className="min-w-full divide-y divide-white/10">
                                    <thead className="bg-white/5">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                {t("prices.th_registrar")}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                {t("prices.th_tld")}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                {t("prices.th_price")}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                {t("prices.th_currency")}
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                {t("prices.th_action")}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 bg-gray-900/50">
                                        {prices.map((p) => (
                                            <tr key={p.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="h-4 w-4 text-gray-500" />
                                                        {p.registrar === "全部" ? t("prices.all_registrars") : p.registrar}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                    <div className="flex items-center gap-2">
                                                        <Globe className="h-4 w-4 text-emerald-500/50" />
                                                        {p.tld}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-400">
                                                    {getCurrencySymbol(p.currency || userCurrency)}{p.price.toFixed(2)} / {t("prices.year")}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                    {p.currency || t("settings.use_default")}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                    <button
                                                        onClick={() => handleEdit(p)}
                                                        className="text-gray-500 hover:text-emerald-400 transition-colors p-2 rounded-lg hover:bg-emerald-500/10"
                                                        title={t("prices.edit")}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(p.id)}
                                                        className="text-gray-500 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/10"
                                                        title={t("common.delete")}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
