"use client";

import { useState } from "react";
import { Plus, Loader2, X } from "lucide-react";

interface AddDomainModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (domain: string) => Promise<void>;
}

export default function AddDomainModal({ isOpen, onClose, onAdd }: AddDomainModalProps) {
    const [domain, setDomain] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!domain.trim()) {
            setError("请输入域名");
            return;
        }

        setLoading(true);
        try {
            await onAdd(domain.trim());
            setDomain("");
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "添加失败");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md glass-card rounded-2xl p-8 mx-6">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                    <X className="h-5 w-5" />
                </button>

                <h2 className="mb-2 text-xl font-bold text-white">添加域名</h2>
                <p className="mb-6 text-sm text-gray-400">
                    输入域名后系统将自动查询 WHOIS 信息
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="domain" className="mb-2 block text-sm font-medium text-gray-300">
                            域名
                        </label>
                        <input
                            id="domain"
                            type="text"
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            placeholder="例如：example.com"
                            autoFocus
                            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 px-4 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-500/25 transition-all hover:shadow-green-500/40 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    查询中...
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4" />
                                    添加
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
