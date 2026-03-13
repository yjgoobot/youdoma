"use client";

import { Globe, Trash2, Calendar, Building2, RefreshCw, Pencil } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@/i18n/client";
import { CURRENCIES, getCurrencySymbol, type CurrencyCode } from "@/lib/currency";
import EditDomainModal from "@/components/EditDomainModal";

interface Domain {
    id: string;
    name: string;
    registrar: string | null;
    expiryDate: string | null;
    registeredDate: string | null;
    status: string | null;
    lastScanned: string | null;
    currency: string | null;
    customPrice: number | null;
    createdAt: string;
}

interface DomainPrice {
    id: string;
    registrar: string;
    tld: string;
    price: number;
    currency: string | null;
}

interface DomainListProps {
    domains: Domain[];
    prices?: DomainPrice[];
    userCurrency?: string;
    onRefresh: (id: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onDomainUpdated?: (updated: Domain) => void;
    loading: boolean;
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString();
}

function getDaysUntilExpiry(dateStr: string | null): number | null {
    if (!dateStr) return null;
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getStatusBadge(status: string | null, expiryDate: string | null, t: any) {
    const days = getDaysUntilExpiry(expiryDate);

    if (status === "expired" || (days !== null && days < 0)) {
        return (
            <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 border border-red-500/20">
                {t("domain_list.status_expired")}
            </span>
        );
    }
    if (days !== null && days <= 30) {
        return (
            <span className="rounded-full bg-yellow-500/10 px-2.5 py-1 text-xs font-medium text-yellow-400 border border-yellow-500/20">
                {t("domain_list.days_left", { days })}
            </span>
        );
    }
    if (days !== null && days <= 90) {
        return (
            <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-400 border border-orange-500/20">
                {t("domain_list.days_left", { days })}
            </span>
        );
    }
    return (
        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
            {t("domain_list.status_normal")}
        </span>
    );
}

function getDomainPrice(domain: Domain, prices: DomainPrice[] | undefined, userCurrency: string) {
    // Priority 1: domain has a custom price
    if (domain.customPrice != null) {
        const symbol = getCurrencySymbol(domain.currency || userCurrency);
        return { price: domain.customPrice, symbol };
    }

    // Priority 2: match from price rules
    if (!prices) return null;
    const domainTld = "." + domain.name.split('.').slice(1).join('.').toLowerCase();

    const exactMatches = prices.filter(
        p => domain.registrar && p.registrar.toLowerCase() === domain.registrar.toLowerCase() && domainTld.endsWith(p.tld.toLowerCase())
    );
    let bestRule = exactMatches.sort((a, b) => b.tld.length - a.tld.length)[0];

    if (!bestRule) {
        const fallbackMatches = prices.filter(
            p => p.registrar === "全部" && domainTld.endsWith(p.tld.toLowerCase())
        );
        bestRule = fallbackMatches.sort((a, b) => b.tld.length - a.tld.length)[0];
    }

    if (!bestRule) return null;
    // Use the rule's currency if set, otherwise domain currency, otherwise user default
    const symbol = getCurrencySymbol(bestRule.currency || domain.currency || userCurrency);
    return { price: bestRule.price, symbol };
}

export default function DomainList({ domains, prices, userCurrency = "CNY", onRefresh, onDelete, onDomainUpdated, loading }: DomainListProps) {
    const [refreshingIds, setRefreshingIds] = useState<Set<string>>(new Set());
    const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
    const { t } = useTranslation();

    const handleRefresh = async (id: string) => {
        try {
            setRefreshingIds((prev) => new Set(prev).add(id));
            await onRefresh(id);
        } catch (error) {
            console.error("Failed to refresh domain:", error);
        } finally {
            setRefreshingIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
        }
    };
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <RefreshCw className="h-6 w-6 animate-spin text-emerald-400" />
                <span className="ml-3 text-gray-400">{t("common.loading")}</span>
            </div>
        );
    }

    if (domains.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
                    <Globe className="h-8 w-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-300">{t("domain_list.no_domains").split("。")[0]}</h3>
                {t("domain_list.no_domains").split("。")[1] && (
                    <p className="mt-2 text-sm text-gray-500">
                        {t("domain_list.no_domains").split("。")[1]}
                    </p>
                )}
            </div>
        );
    }

    return (
        <>
            <div className="space-y-3">
                {domains.map((domain) => {
                    const priceInfo = getDomainPrice(domain, prices, userCurrency);
                    return (
                        <div
                            key={domain.id}
                            className="glass-card group rounded-xl p-5 transition-all duration-300"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4 min-w-0 flex-1">
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                                        <Globe className="h-5 w-5 text-emerald-400" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h3 className="text-base font-semibold text-white truncate">
                                                {domain.name}
                                            </h3>
                                            {getStatusBadge(domain.status, domain.expiryDate, t)}
                                            {priceInfo && (
                                                <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400 border border-blue-500/20">
                                                    {priceInfo.symbol}{priceInfo.price.toFixed(2)} / {t("prices.year")}
                                                </span>
                                            )}
                                            {domain.currency && (
                                                <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-400 border border-purple-500/20">
                                                    {getCurrencySymbol(domain.currency)} {domain.currency}
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-gray-400">
                                            {domain.registrar && (
                                                <span className="flex items-center gap-1.5">
                                                    <Building2 className="h-3.5 w-3.5 text-gray-500" />
                                                    {domain.registrar}
                                                </span>
                                            )}
                                            {domain.registeredDate && (
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-gray-500" />
                                                    {t("domain_list.registration_date")}：{formatDate(domain.registeredDate)}
                                                </span>
                                            )}
                                            {domain.expiryDate && (
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-gray-500" />
                                                    {t("domain_list.expiration_date")}：{formatDate(domain.expiryDate)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="ml-4 flex items-center gap-1 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                                    <button
                                        onClick={() => setEditingDomain(domain)}
                                        className="rounded-lg p-2 text-gray-500 transition-all hover:bg-blue-500/10 hover:text-blue-400"
                                        title={t("domain_edit.title")}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleRefresh(domain.id)}
                                        disabled={refreshingIds.has(domain.id)}
                                        className="rounded-lg p-2 text-gray-500 transition-all hover:bg-emerald-500/10 hover:text-emerald-400 disabled:opacity-50"
                                        title={t("domain_list.action_refresh")}
                                    >
                                        <RefreshCw className={`h-4 w-4 ${refreshingIds.has(domain.id) ? "animate-spin text-emerald-400" : ""}`} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm(t("domain_list.delete_confirm"))) {
                                                onDelete(domain.id);
                                            }
                                        }}
                                        className="rounded-lg p-2 text-gray-500 transition-all hover:bg-red-500/10 hover:text-red-400"
                                        title={t("domain_list.action_delete")}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Edit Domain Modal */}
            {editingDomain && (
                <EditDomainModal
                    isOpen={!!editingDomain}
                    onClose={() => setEditingDomain(null)}
                    domainId={editingDomain.id}
                    domainName={editingDomain.name}
                    currentCurrency={editingDomain.currency}
                    currentCustomPrice={editingDomain.customPrice}
                    userCurrency={userCurrency}
                    onSaved={(updated) => {
                        if (onDomainUpdated) {
                            onDomainUpdated(updated);
                        }
                        setEditingDomain(null);
                    }}
                />
            )}
        </>
    );
}
