import Link from "next/link";
import { Globe, Search, Bell, Shield, ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20">
        {/* Background glow effects */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/4 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
          <div className="absolute top-1/3 left-1/3 h-[300px] w-[300px] rounded-full bg-green-500/8 blur-[100px] animate-glow" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center text-center">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400">
              <Sparkles className="h-4 w-4" />
              智能域名管理平台
            </div>

            {/* Heading */}
            <h1 className="max-w-4xl text-5xl font-bold leading-tight tracking-tight text-white md:text-7xl">
              轻松掌控
              <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
                {" "}每一个域名
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-400 md:text-xl">
              自动 WHOIS 查询、到期智能提醒、一站式域名监控。
              让域名管理变得简单而优雅。
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-green-500/25 transition-all hover:shadow-green-500/40 hover:brightness-110"
              >
                免费开始使用
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-8 py-3.5 text-base font-medium text-gray-300 transition-all hover:border-white/20 hover:bg-white/5"
              >
                已有账号？登录
              </Link>
            </div>
          </div>

          {/* Dashboard preview mockup */}
          <div className="relative mx-auto mt-20 max-w-4xl">
            <div className="glass-card rounded-2xl p-1">
              <div className="rounded-xl bg-gray-900/80 p-6">
                {/* Mock header bar */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500/60" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                    <div className="h-3 w-3 rounded-full bg-green-500/60" />
                  </div>
                  <div className="h-6 w-48 rounded-md bg-white/5" />
                  <div className="h-6 w-6" />
                </div>
                {/* Mock domain rows */}
                {["example.com", "mysite.cn", "startup.io"].map((d, i) => (
                  <div
                    key={d}
                    className="mb-2 flex items-center justify-between rounded-lg bg-white/[0.02] px-4 py-3 border border-white/[0.04]"
                    style={{ animationDelay: `${i * 200}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm font-medium text-gray-200">{d}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-500">
                        到期：2025-{12 - i * 3}-01
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${i === 0
                          ? "bg-emerald-500/10 text-emerald-400"
                          : i === 1
                            ? "bg-yellow-500/10 text-yellow-400"
                            : "bg-emerald-500/10 text-emerald-400"
                        }`}>
                        {i === 1 ? "即将到期" : "正常"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Gradient overlay at bottom */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-gray-950 to-transparent" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              强大而<span className="text-emerald-400">简洁</span>的功能
            </h2>
            <p className="mt-4 text-gray-400">
              为域名投资者和站长打造的专业管理工具
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Search,
                title: "自动 WHOIS 查询",
                desc: "添加域名即自动获取注册商、注册时间、到期时间等完整信息，无需手动查询。",
              },
              {
                icon: Bell,
                title: "到期智能提醒",
                desc: "系统持续监控域名状态，到期前自动提醒，再也不会错过续费时间。",
              },
              {
                icon: Shield,
                title: "一站式管理",
                desc: "集中管理所有域名，清晰的列表视图，快速掌握每个域名的状态和信息。",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="glass-card group rounded-2xl p-8 transition-all duration-300"
              >
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 transition-colors group-hover:bg-emerald-500/20">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-lg font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-400">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="glass-card relative overflow-hidden rounded-3xl p-12 text-center md:p-16">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-[80px]" />
              <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-green-500/10 blur-[80px]" />
            </div>
            <div className="relative">
              <h2 className="text-3xl font-bold text-white md:text-4xl">
                开始管理你的域名
              </h2>
              <p className="mt-4 text-gray-400">
                免费注册，立即体验智能域名管理
              </p>
              <Link
                href="/register"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-green-500/25 transition-all hover:shadow-green-500/40 hover:brightness-110"
              >
                立即注册
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-emerald-400" />
              <span className="font-semibold text-white">
                You<span className="text-emerald-400">Doma</span>
              </span>
            </div>
            <p className="text-sm text-gray-500">
              © 2025 YouDoma. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
