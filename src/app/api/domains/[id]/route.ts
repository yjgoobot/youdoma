import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CURRENCIES } from "@/lib/currency";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as { id?: string })?.id;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { currency, customPrice } = body;

        // Validate currency if provided
        if (currency !== undefined && currency !== null && !CURRENCIES.includes(currency)) {
            return NextResponse.json(
                { error: "Invalid currency" },
                { status: 400 }
            );
        }

        // Verify ownership
        const domain = await prisma.domain.findFirst({
            where: { id, userId },
        });

        if (!domain) {
            return NextResponse.json({ error: "Domain not found" }, { status: 404 });
        }

        // Build update data
        const updateData: any = {};
        if (currency !== undefined) {
            updateData.currency = currency;
        }
        if (customPrice !== undefined) {
            updateData.customPrice = customPrice;
        }

        const updated = await prisma.domain.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("PATCH /api/domains/[id] error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
