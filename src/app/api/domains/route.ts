import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { lookupDomain } from "@/lib/whois";
import { getDictionary } from "@/i18n/server";

export const dynamic = "force-dynamic";

export async function GET() {
    const dict = await getDictionary();
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: dict.api_msgs.unauthorized }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
        return NextResponse.json({ error: dict.api_msgs.unauthorized }, { status: 401 });
    }

    const domains = await prisma.domain.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(domains);
}

export async function POST(request: Request) {
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
        const { name } = await request.json();

        if (!name || typeof name !== "string") {
            return NextResponse.json({ error: dict.api_msgs.domain_invalid }, { status: 400 });
        }

        // Clean domain name
        const domainName = name.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");

        // Check if domain already exists for this user
        const existing = await prisma.domain.findFirst({
            where: { name: domainName, userId },
        });

        if (existing) {
            return NextResponse.json({ error: dict.api_msgs.domain_exists }, { status: 409 });
        }

        // Lookup WHOIS info
        const whoisInfo = await lookupDomain(domainName);

        // Create domain record
        const domain = await prisma.domain.create({
            data: {
                name: domainName,
                registrar: whoisInfo.registrar,
                registeredDate: whoisInfo.registeredDate,
                expiryDate: whoisInfo.expiryDate,
                updatedDate: whoisInfo.updatedDate,
                lastScanned: new Date(),
                status: whoisInfo.expiryDate && whoisInfo.expiryDate < new Date() ? "expired" : "active",
                userId,
            },
        });

        return NextResponse.json(domain, { status: 201 });
    } catch (error) {
        console.error("Error adding domain:", error);
        return NextResponse.json({ error: dict.api_msgs.domain_add_error }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
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
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: dict.api_msgs.domain_missing_id }, { status: 400 });
        }

        // Verify ownership
        const domain = await prisma.domain.findFirst({
            where: { id, userId },
        });

        if (!domain) {
            return NextResponse.json({ error: dict.api_msgs.domain_not_found }, { status: 404 });
        }

        await prisma.domain.delete({ where: { id } });

        return NextResponse.json({ message: dict.api_msgs.domain_deleted });
    } catch (error) {
        console.error("Error deleting domain:", error);
        return NextResponse.json({ error: dict.api_msgs.domain_delete_error }, { status: 500 });
    }
}
