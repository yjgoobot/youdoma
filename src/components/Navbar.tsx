"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Globe, LogOut, User } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "@/i18n/client";

export default function Navbar() {
    const { data: session } = useSession();
    const { t } = useTranslation();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-gray-950/80 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-green-600 shadow-lg shadow-green-500/25 transition-shadow group-hover:shadow-green-500/40">
                        <Globe className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">
                        You<span className="text-emerald-400">Doma</span>
                    </span>
                </Link>

                <div className="flex items-center gap-3">
                    <LanguageSwitcher />

                    {session ? (
                        <>
                            <Link
                                href="/dashboard"
                                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
                            >
                                {t("nav.dashboard")}
                            </Link>
                            <div className="hidden sm:flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5">
                                <User className="h-4 w-4 text-emerald-400" />
                                <span className="text-sm text-gray-300 truncate max-w-[120px]">
                                    {session.user?.name || session.user?.email}
                                </span>
                            </div>
                            <button
                                onClick={() => signOut({ callbackUrl: "/" })}
                                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-red-400"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline">{t("nav.logout")}</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
                            >
                                {t("nav.login")}
                            </Link>
                            <Link
                                href="/register"
                                className="rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-green-500/25 transition-all hover:shadow-green-500/40 hover:brightness-110"
                            >
                                {t("nav.register")}
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
