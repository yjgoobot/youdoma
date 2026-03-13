import { whoisDomain, firstResult } from "whoiser";

export interface WhoisResult {
    registrar: string | null;
    registeredDate: Date | null;
    expiryDate: Date | null;
    updatedDate: Date | null;
}

const REGISTRAR_KEYS = [
    "Registrar",
    "registrar",
    "Sponsoring Registrar",
    "Registrar Organization",
    "Registrar Name",
];

const REGISTERED_DATE_KEYS = [
    "Creation Date",
    "Created Date",
    "Registration Date",
    "Registration Time",
    "Created On",
];

const EXPIRY_DATE_KEYS = [
    "Registry Expiry Date",
    "Expiry Date",
    "Expiration Date",
    "Expiration Time",
    "Expiry Time",
    "Paid-till",
];

const UPDATED_DATE_KEYS = [
    "Updated Date",
    "Last Updated Time",
    "Last Modified",
    "Last Update",
    "Changed",
];

function parseDate(value: unknown): Date | null {
    if (!value) return null;
    const str = Array.isArray(value) ? value[0] : String(value);
    const normalized = str
        .trim()
        .replace(/\s+/g, " ")
        .replace(/年/g, "-")
        .replace(/月/g, "-")
        .replace(/日/g, "")
        .replace(/\//g, "-")
        .replace(/\.(?=\d{1,2}(?:\D|$))/g, "-");

    const direct = new Date(normalized);
    if (!isNaN(direct.getTime())) return direct;

    // Common WHOIS format: 2026-03-13 12:34:56
    const withT = normalized.replace(" ", "T");
    const secondary = new Date(withT);
    return isNaN(secondary.getTime()) ? null : secondary;
}

function decodeHtmlEntities(input: string): string {
    return input
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .trim();
}

function extractFirst(value: unknown): string | null {
    if (!value) return null;
    if (Array.isArray(value)) return value[0] || null;
    return String(value) || null;
}

function toTextLines(value: unknown): string[] {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value
            .map((line) => String(line ?? "").trim())
            .filter(Boolean);
    }

    return String(value)
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
}

function extractFromTextLines(textLines: string[], key: string): string | null {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`^${escaped}\\s*[:：]\\s*(.+)$`, "i");

    for (const line of textLines) {
        const match = line.match(re);
        if (match?.[1]) return match[1].trim();
    }

    return null;
}

function pickValue(record: Record<string, unknown>, textLines: string[], keys: string[]): string | null {
    for (const key of keys) {
        const byKey = extractFirst(record[key]);
        if (byKey) return byKey;

        const byText = extractFromTextLines(textLines, key);
        if (byText) return byText;
    }

    return null;
}

function parseWhoisRecord(record: Record<string, unknown>): WhoisResult {
    const textLines = toTextLines(record.text);

    return {
        registrar: pickValue(record, textLines, REGISTRAR_KEYS),
        registeredDate: parseDate(pickValue(record, textLines, REGISTERED_DATE_KEYS)),
        expiryDate: parseDate(pickValue(record, textLines, EXPIRY_DATE_KEYS)),
        updatedDate: parseDate(pickValue(record, textLines, UPDATED_DATE_KEYS)),
    };
}

function scoreResult(result: WhoisResult): number {
    let score = 0;
    if (result.registrar) score += 1;
    if (result.registeredDate) score += 2;
    if (result.expiryDate) score += 2;
    if (result.updatedDate) score += 1;
    return score;
}

function getRdapCandidates(domain: string): string[] {
    const lower = domain.toLowerCase();
    const candidates = [
        `https://rdap.org/domain/${lower}`,
    ];

    // Some ccTLDs are better resolved via registry RDAP directly.
    if (lower.endsWith(".ch") || lower.endsWith(".li")) {
        candidates.unshift(`https://rdap.nic.ch/domain/${lower}`);
    }

    if (lower.endsWith(".cn")) {
        candidates.unshift(
            `https://rdap.cnnic.cn/domain/${lower}`,
            `https://rdap.conac.cn/domain/${lower}`
        );
    }

    return [...new Set(candidates)];
}

async function queryWhoisWebFallback(domain: string): Promise<WhoisResult> {
    const target = domain.toLowerCase();
    const url = `https://whois.chinaz.com/${encodeURIComponent(target)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                "user-agent": "Mozilla/5.0",
                "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
            },
        });

        if (!response.ok) {
            throw new Error(`WHOIS web fallback failed with status ${response.status}`);
        }

        const html = await response.text();

        const registrarMatch = html.match(/id="registrar_name"[^>]*data-registrar="([^"]+)"/i);
        const createdMatch = html.match(/<div\s+item-label>\s*注册时间\s*<\/div>\s*<div\s+item-value[^>]*>\s*([^<\n\r]+)\s*<\/div>/i);
        const expiryMatch = html.match(/<div\s+item-label>\s*过期时间\s*<\/div>\s*<div\s+item-value[^>]*>\s*([^<\n\r]+)\s*<\/div>/i);
        const updatedMatch = html.match(/<div\s+item-label>\s*更新时间\s*<\/div>\s*<div\s+item-value[^>]*>\s*([^<\n\r]+)\s*<\/div>/i);

        const registrar = registrarMatch?.[1] ? decodeHtmlEntities(registrarMatch[1]) : null;
        const registeredDate = parseDate(createdMatch?.[1] || null);
        const expiryDate = parseDate(expiryMatch?.[1] || null);
        const updatedDate = parseDate(updatedMatch?.[1] || null);

        if (!registrar && !registeredDate && !expiryDate && !updatedDate) {
            throw new Error("WHOIS web fallback returned no parseable fields");
        }

        return {
            registrar,
            registeredDate,
            expiryDate,
            updatedDate,
        };
    } finally {
        clearTimeout(timeoutId);
    }
}

async function queryRdap(domain: string): Promise<WhoisResult> {
    const candidates = getRdapCandidates(domain);
    let lastError: unknown = null;

    for (const rdapUrl of candidates) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            const response = await fetch(rdapUrl, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`RDAP query failed with status ${response.status}`);
            }

            const data = await response.json();
            const events = Array.isArray(data.events) ? data.events : [];

            const getEventDate = (actions: string[]) => {
                const event = events.find((e: any) => actions.includes(String(e?.eventAction || "").toLowerCase()));
                return event ? parseDate(event.eventDate) : null;
            };

            const registeredDate = getEventDate(["registration", "registered"]);
            const expiryDate = getEventDate(["expiration", "expiry", "expires"]);
            const updatedDate = getEventDate([
                "last changed",
                "last update of rdap database",
                "last update",
                "changed",
            ]);

            let registrar = null;
            const registrarEntity = (Array.isArray(data.entities) ? data.entities : []).find(
                (e: any) => Array.isArray(e?.roles) && e.roles.includes("registrar")
            );
            if (registrarEntity?.vcardArray) {
                const vcards = registrarEntity.vcardArray[1] || [];
                const fnVar = vcards.find((v: any) => v[0] === "fn");
                const orgVar = vcards.find((v: any) => v[0] === "org");

                if (fnVar?.[3]) {
                    registrar = String(fnVar[3]);
                } else if (orgVar?.[3]) {
                    registrar = String(orgVar[3]);
                }
            }

            return {
                registrar,
                registeredDate,
                expiryDate,
                updatedDate,
            };
        } catch (error) {
            lastError = error;
            console.error(`RDAP fallback failed via ${rdapUrl} for ${domain}:`, error instanceof Error ? error.message : error);
        }
    }

    throw (lastError || new Error("All RDAP endpoints failed"));
}

export async function lookupDomain(domain: string): Promise<WhoisResult> {
    let result: WhoisResult = {
        registrar: null,
        registeredDate: null,
        expiryDate: null,
        updatedDate: null,
    };

    let whoiserSuccess = false;
    const skipWhoiser = domain.endsWith('.ch') || domain.endsWith('.li') || domain.endsWith('.io');

    if (!skipWhoiser) {
        try {
            const raw = await whoisDomain(domain, { follow: 2, timeout: 10000 });
            const data = firstResult(raw) as Record<string, unknown>;
            const allRecords = [
                data,
                ...Object.values(raw as Record<string, unknown>).filter(
                    (v): v is Record<string, unknown> => typeof v === "object" && v !== null
                ),
            ];

            let best = result;
            let bestScore = -1;

            for (const record of allRecords) {
                const parsed = parseWhoisRecord(record);
                const score = scoreResult(parsed);
                if (score > bestScore) {
                    best = parsed;
                    bestScore = score;
                }
            }

            result = best;
            if (result.registeredDate || result.expiryDate) {
                whoiserSuccess = true;
            }
        } catch (error) {
            console.error(`WHOIS lookup failed for ${domain}:`, error instanceof Error ? error.message : error);
        }
    }

    if (!whoiserSuccess) {
        console.log(`WHOIS failed or incomplete for ${domain}, attempting RDAP fallback...`);
        try {
            const rdapResult = await queryRdap(domain);
            result = {
                registrar: rdapResult.registrar || result.registrar,
                registeredDate: rdapResult.registeredDate || result.registeredDate,
                expiryDate: rdapResult.expiryDate || result.expiryDate,
                updatedDate: rdapResult.updatedDate || result.updatedDate,
            };
        } catch (rdapError) {
            console.error(`RDAP fallback also failed for ${domain}`);
        }
    }

    if (!result.registeredDate && !result.expiryDate && domain.toLowerCase().endsWith(".cn")) {
        console.log(`RDAP unavailable for ${domain}, attempting web WHOIS fallback...`);
        try {
            const webResult = await queryWhoisWebFallback(domain);
            result = {
                registrar: webResult.registrar || result.registrar,
                registeredDate: webResult.registeredDate || result.registeredDate,
                expiryDate: webResult.expiryDate || result.expiryDate,
                updatedDate: webResult.updatedDate || result.updatedDate,
            };
        } catch (webError) {
            console.error(`Web WHOIS fallback also failed for ${domain}:`, webError instanceof Error ? webError.message : webError);
        }
    }

    return result;
}
