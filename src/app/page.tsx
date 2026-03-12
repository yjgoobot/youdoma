import Link from "next/link";
import { Globe, Search, Bell, Shield, ArrowRight, Sparkles } from "lucide-react";
import { getDictionary } from "@/i18n/server";

export default async function Home() {
  const dict = await getDictionary();
  const t = dict.home;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/4 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
          <div className="absolute top-1/3 left-1/3 h-[300px] w-[300px] rounded-full bg-green-500/8 blur-[100px] animate-glow" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center text-center">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400">
              <Sparkles className="h-4 w-4" />
              {t.badge}
            </div>

            {/* Heading */}
            <h1 className="max-w-4xl text-5xl font-bold leading-tight tracking-tight text-white md:text-7xl">
              {t.title1}
              <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
                {" "}{t.title2}
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-400 md:text-xl">
              {t.subtitle}
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-green-500/25 transition-all hover:shadow-green-500/40 hover:brightness-110"
              >
                {t.start_free}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-8 py-3.5 text-base font-medium text-gray-300 transition-all hover:border-white/20 hover:bg-white/5"
              >
                {t.login_existing}
              </Link>
            </div>
          </div>

          {/* Dashboard preview mockup */}
          <div className="relative mx-auto mt-20 max-w-4xl">
            <div className="glass-card rounded-2xl p-1">
              <div className="rounded-xl bg-gray-900/80 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500/60" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                    <div className="h-3 w-3 rounded-full bg-green-500/60" />
                  </div>
                  <div className="h-6 w-48 rounded-md bg-white/5" />
                  <div className="h-6 w-6" />
                </div>
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
                        2025-{12 - i * 3}-01
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${i === 1
                        ? "bg-yellow-500/10 text-yellow-400"
                        : "bg-emerald-500/10 text-emerald-400"
                        }`}>
                        {i === 1 ? dict.dashboard.expiring_soon : dict.dashboard.normal}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-gray-950 to-transparent" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              {t.features_title}<span className="text-emerald-400">{t.features_title_highlight}</span>
              {" "}{(dict.home as any)["features_title_after"] || ""}
            </h2>
            <p className="mt-4 text-gray-400">
              {t.features_subtitle}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Search,
                title: t.feature1_title,
                desc: t.feature1_desc,
              },
              {
                icon: Bell,
                title: t.feature2_title,
                desc: t.feature2_desc,
              },
              {
                icon: Shield,
                title: t.feature3_title,
                desc: t.feature3_desc,
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
                {t.cta_title}
              </h2>
              <p className="mt-4 text-gray-400">
                {t.cta_desc}
              </p>
              <Link
                href="/register"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-green-500/25 transition-all hover:shadow-green-500/40 hover:brightness-110"
              >
                {t.cta_button}
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
              © 2025 YouDoma. {t.footer_rights}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
