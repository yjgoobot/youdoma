import { cookies } from "next/headers";

export type Locale = "en" | "zh" | "ja";

const dictionaries = {
    en: () => import("./locales/en.json").then((module) => module.default),
    zh: () => import("./locales/zh.json").then((module) => module.default),
    ja: () => import("./locales/ja.json").then((module) => module.default),
};

export async function getLocale(): Promise<Locale> {
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;

    if (localeCookie === "en" || localeCookie === "zh" || localeCookie === "ja") {
        return localeCookie as Locale;
    }

    // Default to English
    return "en";
}

export async function getDictionary(locale?: Locale) {
    const currentLocale = locale ?? (await getLocale());
    return dictionaries[currentLocale]();
}
