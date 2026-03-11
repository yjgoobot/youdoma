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

async function queryRdap(domain: string): Promise<WhoisResult> {
    const isChOrLi = domain.endsWith('.ch') || domain.endsWith('.li');
    const rdapUrl = isChOrLi
        ? `https://rdap.nic.ch/domain/${domain}`
        : `https://rdap.org/domain/${domain}`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(rdapUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`RDAP query failed with status ${response.status}`);
        }

        const data = await response.json();
        const events = data.events || [];

        const getEventDate = (action: string) => {
            const event = events.find((e: any) => e.eventAction === action);
            return event ? parseDate(event.eventDate) : null;
        };

        const registeredDate = getEventDate("registration");
        const expiryDate = getEventDate("expiration");
        const updatedDate = getEventDate("last changed");

        let registrar = null;
        const registrarEntity = (data.entities || []).find((e: any) => e.roles && e.roles.includes("registrar"));
        if (registrarEntity && registrarEntity.vcardArray) {
            const vcards = registrarEntity.vcardArray[1] || [];
            const fnVar = vcards.find((v: any) => v[0] === 'fn');
            const orgVar = vcards.find((v: any) => v[0] === 'org');

            if (fnVar && fnVar[3]) {
                registrar = String(fnVar[3]);
            } else if (orgVar && orgVar[3]) {
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
        console.error(`RDAP fallback failed for ${domain}:`, error instanceof Error ? error.message : error);
        throw error;
    }
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
            const raw = await whoisDomain(domain, { follow: 1 });
            const data = firstResult(raw) as Record<string, unknown>;

            if (data) {
                const textLines = Array.isArray(data.text) ? data.text : [];
                // whoiser might return a single key of the domain structure, meaning it didn't fail but wasn't standard.
                // Let's rely on standard keys first.
                result = {
                    registrar: extractFirst(data["Registrar"]) || extractFirst(data["registrar"]),
                    registeredDate: parseDate(data["Creation Date"] || data["Created Date"] || data["Registration Date"]),
                    expiryDate: parseDate(data["Registry Expiry Date"] || data["Expiry Date"] || data["Expiration Date"]),
                    updatedDate: parseDate(data["Updated Date"]),
                };

                if (result.registeredDate || result.expiryDate) {
                    whoiserSuccess = true;
                }
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

    return result;
}
