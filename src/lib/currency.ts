export const CURRENCIES = ["USD", "CNY", "JPY", "EUR", "GBP"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
    USD: "$",
    CNY: "¥",
    JPY: "¥",
    EUR: "€",
    GBP: "£",
};

export function getCurrencySymbol(code: string | null | undefined): string {
    if (!code) return "¥";
    return CURRENCY_SYMBOLS[code as CurrencyCode] || "¥";
}
