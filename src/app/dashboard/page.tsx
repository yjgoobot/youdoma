"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Globe, LayoutDashboard, DollarSign, Settings } from "lucide-react";
import Link from "next/link";
import AddDomainModal from "@/components/AddDomainModal";
import DomainList from "@/components/DomainList";
import { useTranslation } from "@/i18n/client";
import { getCurrencySymbol } from "@/lib/currency";

interface Domain {
    id: string;
    name: string;
    registrar: string | null;
    expiryDate: string | null;
    registeredDate: string | null;
    status: string | null;
    lastScanned: string | null;
    currency: string | null;
    createdAt: string;
}

interface DomainPrice {
    id: string;
    registrar: string;
    tld: string;
    price: number;
}

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const { t, dictionary: dict } = useTranslation();
    const router = useRouter();
    const [domains, setDomains] = useState<Domain[]>([]);
    const [prices, setPrices] = useState<DomainPrice[]>([]);
    const [userCurrency, setUserCurrency] = useState("CNY");
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);

    // Redirect if not authenticated
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    // Fetch domains and prices
    const fetchDomainsAndPrices = useCallback(async () => {
        try {
            setLoading(true);
            const [domainsRes, pricesRes, settingsRes] = await Promise.all([
                fetch("/api/domains"),
                fetch("/api/prices"),
                fetch("/api/user/settings")
            ]);
            if (domainsRes.ok) {
                const data = await domainsRes.json();
                setDomains(data);
            }
            if (pricesRes.ok) {
                const data = await pricesRes.json();
                setPrices(data);
            }
            if (settingsRes.ok) {
                const data = await settingsRes.json();
                setUserCurrency(data.currency || "CNY");
            }
        } catch (error) {
            console.error("Failed to fetch domains and prices:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status === "authenticated") {
            fetchDomainsAndPrices();
        }
    }, [status, fetchDomainsAndPrices]);

    // Add domain
    const handleAddDomain = async (domainName: string) => {
        const res = await fetch("/api/domains", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: domainName }),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || t("api_msgs.domain_add_error"));
        }

        setDomains((prev) => [data, ...prev]);
    };

    // Delete domain
    const handleDeleteDomain = async (id: string) => {
        const res = await fetch(`/api/domains?id=${id}`, {
            method: "DELETE",
        });

        if (res.ok) {
            setDomains((prev) => prev.filter((d) => d.id !== id));
        }
    };

    // Refresh domain
    const handleRefreshDomain = async (id: string) => {
        const res = await fetch(`/api/domains/${id}/refresh`, {
            method: "POST",
        });

        if (res.ok) {
            const updatedDomain = await res.json();
            setDomains((prev) => prev.map((d) => (d.id === id ? updatedDomain : d)));
        } else {
            const data = await res.json();
            throw new Error(data.error || t("api_msgs.domain_refresh_error"));
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

    const totalDomains = domains.length;
    const expiringDomains = domains.filter((d) => {
        if (!d.expiryDate) return false;
        const days = Math.ceil(
            (new Date(d.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return days > 0 && days <= 30;
    }).length;
    const expiredDomains = domains.filter((d) => {
        if (!d.expiryDate) return false;
        return new Date(d.expiryDate).getTime() < Date.now();
    }).length;

    const totalAnnualCost = domains.reduce((sum, domain) => {
        const domainTld = "." + domain.name.split('.').slice(1).join('.').toLowerCase();

        // 1. Try to find exact match for registrar and TLD
        const exactMatches = prices.filter(
            p => domain.registrar && p.registrar.toLowerCase() === domain.registrar.toLowerCase() && domainTld.endsWith(p.tld.toLowerCase())
        );
        let bestRule = exactMatches.sort((a, b) => b.tld.length - a.tld.length)[0];

        // 2. If no exact match, try to find "全部" fallback for the TLD
        if (!bestRule) {
            const fallbackMatches = prices.filter(
                p => p.registrar === "全部" && domainTld.endsWith(p.tld.toLowerCase())
            );
            bestRule = fallbackMatches.sort((a, b) => b.tld.length - a.tld.length)[0];
        }

        return sum + (bestRule ? bestRule.price : 0);
    }, 0);

    return (
        <div className="min-h-screen bg-gray-950 pt-24 pb-12">
            <div className="mx-auto max-w-5xl px-6">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <LayoutDashboard className="h-6 w-6 text-emerald-400" />
                            <h1 className="text-2xl font-bold text-white">{t("dashboard.title")}</h1>
                        </div>
                        <p className="text-sm text-gray-400">
                            {t("dashboard.search_placeholder")}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard/settings"
                            className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/10"
                        >
                            <Settings className="h-4 w-4 text-emerald-400" />
                            {t("dashboard.settings")}
                        </Link>
                        <Link
                            href="/dashboard/prices"
                            className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/10"
                        >
                            <DollarSign className="h-4 w-4 text-emerald-400" />
                            {t("prices.title")}
                        </Link>
                        <button
                            onClick={() => setModalOpen(true)}
                            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-500/25 transition-all hover:shadow-green-500/40 hover:brightness-110"
                        >
                            <Plus className="h-4 w-4" />
                            {t("dashboard.add_domain")}
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="mb-8 grid grid-cols-4 gap-4">
                    <div className="glass-card rounded-xl p-5">
                        <p className="text-sm text-gray-400">{t("dashboard.total_domains")}</p>
                        <p className="mt-1 text-2xl font-bold text-white">{totalDomains}</p>
                    </div>
                    <div className="glass-card rounded-xl p-5">
                        <p className="text-sm text-gray-400">{t("dashboard.total_annual_cost")}</p>
                        <p className="mt-1 text-2xl font-bold text-emerald-400">{getCurrencySymbol(userCurrency)}{totalAnnualCost.toFixed(2)}</p>
                    </div>
                    <div className="glass-card rounded-xl p-5">
                        <p className="text-sm text-gray-400">{t("dashboard.expiring_soon")}</p>
                        <p className="mt-1 text-2xl font-bold text-yellow-400">{expiringDomains}</p>
                    </div>
                    <div className="glass-card rounded-xl p-5">
                        <p className="text-sm text-gray-400">{t("domain_list.status_expired")}</p>
                        <p className="mt-1 text-2xl font-bold text-red-400">{expiredDomains}</p>
                    </div>
                </div>

                {/* Domain List */}
                <DomainList
                    domains={domains}
                    prices={prices}
                    userCurrency={userCurrency}
                    onRefresh={handleRefreshDomain}
                    onDelete={handleDeleteDomain}
                    loading={loading}
                />
            </div>

            {/* Add Domain Modal */}
            <AddDomainModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onAdd={handleAddDomain}
            />
        </div>
    );
}
