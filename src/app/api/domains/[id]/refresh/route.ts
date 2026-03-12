import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { lookupDomain } from "@/lib/whois";
import { getDictionary } from "@/i18n/server";

export async function POST(
    request: Request,
    { params }: { params: { id: string } | Promise<{ id: string }> }
) {
    const dict = await getDictionary();
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: dict.api_msgs.unauthorized }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
        return NextResponse.json({ error: dict.api_msgs.unauthorized }, { status: 401 });
    }

    try {
        const resolvedParams = await params;
        const id = resolvedParams.id;

        // Verify ownership
        const domain = await prisma.domain.findFirst({
            where: { id, userId },
        });

        if (!domain) {
            return NextResponse.json({ error: dict.api_msgs.domain_not_found }, { status: 404 });
        }

        // Lookup WHOIS info
        const whoisInfo = await lookupDomain(domain.name);

        // Update domain record
        const updatedDomain = await prisma.domain.update({
            where: { id },
            data: {
                registrar: whoisInfo.registrar,
                registeredDate: whoisInfo.registeredDate,
                expiryDate: whoisInfo.expiryDate,
                updatedDate: whoisInfo.updatedDate,
                lastScanned: new Date(),
                status: whoisInfo.expiryDate && whoisInfo.expiryDate < new Date() ? "expired" : "active",
            },
        });

        return NextResponse.json(updatedDomain);
    } catch (error) {
        console.error("Error refreshing domain:", error);
        const dict = await getDictionary();
        return NextResponse.json({ error: dict.api_msgs.domain_refresh_error }, { status: 500 });
    }
}
