"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2, Tag, Building2, Globe, DollarSign, Plus } from "lucide-react";
import Link from "next/link";

interface DomainPrice {
    id: string;
    registrar: string;
    tld: string;
    price: number;
}

export default function PricesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [prices, setPrices] = useState<DomainPrice[]>([]);
    const [registrars, setRegistrars] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const [registrar, setRegistrar] = useState("");
    const [tld, setTld] = useState("");
    const [price, setPrice] = useState("");
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
            const [pricesRes, domainsRes] = await Promise.all([
                fetch("/api/prices"),
                fetch("/api/domains")
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!registrar || !tld || !price) {
            setError("请填写完整信息");
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
                    price: parseFloat(price)
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "保存失败");

            setRegistrar("");
            setTld("");
            setPrice("");
            fetchData();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("确定要删除这条价格配置吗？")) return;

        try {
            const res = await fetch(`/api/prices?id=${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setPrices(prices.filter(p => p.id !== id));
            } else {
                const data = await res.json();
                alert(data.error || "删除失败");
            }
        } catch (error) {
            console.error("Failed to delete price:", error);
            alert("删除失败");
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
                            <h1 className="text-2xl font-bold text-white">价格配置</h1>
                        </div>
                        <p className="text-sm text-gray-400">
                            设置各个注册商不同后缀域名的每年续费价格
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Add Form */}
                    <div className="md:col-span-1 space-y-4">
                        <div className="glass-card rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Plus className="h-5 w-5 text-emerald-400" />
                                添加价格规则
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
                                        {error}
                                    </div>
                                )}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-300">
                                        注册商 (Registrar)
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
                                            placeholder="如: Tencent, Aliyun，可填'全部'"
                                            required
                                        />
                                        <datalist id="registrar-options">
                                            <option value="全部" />
                                            {registrars.map((r, i) => (
                                                <option key={i} value={r} />
                                            ))}
                                        </datalist>
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-300">
                                        域名后缀 (TLD)
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
                                            placeholder="如: .com"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-300">
                                        价格 (每年/元)
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
                                            placeholder="如: 65"
                                            required
                                        />
                                    </div>
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
                                    保存规则
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Rules List */}
                    <div className="md:col-span-2 space-y-4">
                        {loading ? (
                            <div className="flex h-32 items-center justify-center glass-card rounded-xl">
                                <span className="flex items-center gap-2 text-gray-400">
                                    <Globe className="h-5 w-5 animate-spin" />
                                    加载中...
                                </span>
                            </div>
                        ) : prices.length === 0 ? (
                            <div className="flex h-32 flex-col items-center justify-center glass-card rounded-xl text-center p-6">
                                <Tag className="h-8 w-8 text-gray-600 mb-3" />
                                <p className="text-gray-400">暂无价格配置规则</p>
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-xl border border-white/5">
                                <table className="min-w-full divide-y divide-white/10">
                                    <thead className="bg-white/5">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                注册商
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                后缀
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                价格
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                操作
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 bg-gray-900/50">
                                        {prices.map((p) => (
                                            <tr key={p.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="h-4 w-4 text-gray-500" />
                                                        {p.registrar}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                    <div className="flex items-center gap-2">
                                                        <Globe className="h-4 w-4 text-emerald-500/50" />
                                                        {p.tld}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-400">
                                                    ¥{p.price.toFixed(2)}/年
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                    <button
                                                        onClick={() => handleDelete(p.id)}
                                                        className="text-gray-500 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/10"
                                                        title="删除"
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
