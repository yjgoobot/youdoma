import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import { getDictionary, getLocale } from "@/i18n/server";
import { I18nProvider } from "@/i18n/client";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);
  return {
    title: dictionary.metadata?.title || "YouDoma - 智能域名管理",
    description: dictionary.metadata?.description || "轻松管理你的所有域名，自动 WHOIS 查询，到期提醒，一站式域名监控平台。",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);

  return (
    <html lang={locale}>
      <body className={`${inter.variable} antialiased`}>
        <I18nProvider locale={locale} dictionary={dictionary}>
          <Providers>
            <Navbar />
            {children}
          </Providers>
        </I18nProvider>
      </body>
    </html>
  );
}
