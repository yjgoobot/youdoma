"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Globe, LayoutDashboard } from "lucide-react";
import AddDomainModal from "@/components/AddDomainModal";
import DomainList from "@/components/DomainList";

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

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [domains, setDomains] = useState<Domain[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);

    // Redirect if not authenticated
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    // Fetch domains
    const fetchDomains = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/domains");
            if (res.ok) {
                const data = await res.json();
                setDomains(data);
            }
        } catch (error) {
            console.error("Failed to fetch domains:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status === "authenticated") {
            fetchDomains();
        }
    }, [status, fetchDomains]);

    // Add domain
    const handleAddDomain = async (domainName: string) => {
        const res = await fetch("/api/domains", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: domainName }),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "添加失败");
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

    if (status === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-950">
                <div className="flex items-center gap-3 text-gray-400">
                    <Globe className="h-6 w-6 animate-spin text-emerald-400" />
                    加载中...
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

    return (
        <div className="min-h-screen bg-gray-950 pt-24 pb-12">
            <div className="mx-auto max-w-5xl px-6">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <LayoutDashboard className="h-6 w-6 text-emerald-400" />
                            <h1 className="text-2xl font-bold text-white">域名管理</h1>
                        </div>
                        <p className="text-sm text-gray-400">
                            管理和监控你的所有域名
                        </p>
                    </div>
                    <button
                        onClick={() => setModalOpen(true)}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-500/25 transition-all hover:shadow-green-500/40 hover:brightness-110"
                    >
                        <Plus className="h-4 w-4" />
                        添加域名
                    </button>
                </div>

                {/* Stats */}
                <div className="mb-8 grid grid-cols-3 gap-4">
                    <div className="glass-card rounded-xl p-5">
                        <p className="text-sm text-gray-400">域名总数</p>
                        <p className="mt-1 text-2xl font-bold text-white">{totalDomains}</p>
                    </div>
                    <div className="glass-card rounded-xl p-5">
                        <p className="text-sm text-gray-400">即将到期</p>
                        <p className="mt-1 text-2xl font-bold text-yellow-400">{expiringDomains}</p>
                    </div>
                    <div className="glass-card rounded-xl p-5">
                        <p className="text-sm text-gray-400">已过期</p>
                        <p className="mt-1 text-2xl font-bold text-red-400">{expiredDomains}</p>
                    </div>
                </div>

                {/* Domain List */}
                <DomainList
                    domains={domains}
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
