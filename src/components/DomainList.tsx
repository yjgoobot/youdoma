"use client";

import { Globe, Trash2, Calendar, Building2, RefreshCw } from "lucide-react";

interface Domain {
    id: string;
    name: string;
    registrar: string | null;
    expiryDate: string | null;
    registeredDate: string | null;
    status: string | null;
    lastScanned: string | null;
    createdAt: string;
}

interface DomainListProps {
    domains: Domain[];
    onDelete: (id: string) => Promise<void>;
    loading: boolean;
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return "未知";
    return new Date(dateStr).toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
}

function getDaysUntilExpiry(dateStr: string | null): number | null {
    if (!dateStr) return null;
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getStatusBadge(status: string | null, expiryDate: string | null) {
    const days = getDaysUntilExpiry(expiryDate);

    if (status === "expired" || (days !== null && days < 0)) {
        return (
            <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 border border-red-500/20">
                已过期
            </span>
        );
    }
    if (days !== null && days <= 30) {
        return (
            <span className="rounded-full bg-yellow-500/10 px-2.5 py-1 text-xs font-medium text-yellow-400 border border-yellow-500/20">
                {days} 天后到期
            </span>
        );
    }
    if (days !== null && days <= 90) {
        return (
            <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-400 border border-orange-500/20">
                {days} 天后到期
            </span>
        );
    }
    return (
        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
            正常
        </span>
    );
}

export default function DomainList({ domains, onDelete, loading }: DomainListProps) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <RefreshCw className="h-6 w-6 animate-spin text-emerald-400" />
                <span className="ml-3 text-gray-400">加载中...</span>
            </div>
        );
    }

    if (domains.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
                    <Globe className="h-8 w-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-300">还没有域名</h3>
                <p className="mt-2 text-sm text-gray-500">
                    点击上方"添加域名"按钮开始管理你的域名
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {domains.map((domain) => (
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
                                    {getStatusBadge(domain.status, domain.expiryDate)}
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
                                            注册：{formatDate(domain.registeredDate)}
                                        </span>
                                    )}
                                    {domain.expiryDate && (
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5 text-gray-500" />
                                            到期：{formatDate(domain.expiryDate)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => onDelete(domain.id)}
                            className="ml-4 flex-shrink-0 rounded-lg p-2 text-gray-500 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                            title="删除域名"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
