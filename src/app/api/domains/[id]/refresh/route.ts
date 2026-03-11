import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { lookupDomain } from "@/lib/whois";

export async function POST(
    request: Request,
    { params }: { params: { id: string } | Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
        return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    try {
        const resolvedParams = await params;
        const id = resolvedParams.id;

        // Verify ownership
        const domain = await prisma.domain.findFirst({
            where: { id, userId },
        });

        if (!domain) {
            return NextResponse.json({ error: "域名不存在" }, { status: 404 });
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
        return NextResponse.json({ error: "更新域名信息时发生错误" }, { status: 500 });
    }
}
