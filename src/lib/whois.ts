import { whoisDomain, firstResult } from "whoiser";

export interface WhoisResult {
    registrar: string | null;
    registeredDate: Date | null;
    expiryDate: Date | null;
    updatedDate: Date | null;
}

function parseDate(value: unknown): Date | null {
    if (!value) return null;
    const str = Array.isArray(value) ? value[0] : String(value);
    const date = new Date(str);
    return isNaN(date.getTime()) ? null : date;
}

function extractFirst(value: unknown): string | null {
    if (!value) return null;
    if (Array.isArray(value)) return value[0] || null;
    return String(value) || null;
}

export async function lookupDomain(domain: string): Promise<WhoisResult> {
    try {
        const raw = await whoisDomain(domain, { follow: 1 });
        const data = firstResult(raw) as Record<string, unknown>;

        return {
            registrar: extractFirst(data["Registrar"]) || extractFirst(data["registrar"]),
            registeredDate: parseDate(data["Creation Date"] || data["Created Date"] || data["Registration Date"]),
            expiryDate: parseDate(data["Registry Expiry Date"] || data["Expiry Date"] || data["Expiration Date"]),
            updatedDate: parseDate(data["Updated Date"]),
        };
    } catch (error) {
        console.error(`WHOIS lookup failed for ${domain}:`, error);
        return {
            registrar: null,
            registeredDate: null,
            expiryDate: null,
            updatedDate: null,
        };
    }
}
