import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CURRENCIES } from "@/lib/currency";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as { id?: string })?.id;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { currency: true },
        });

        return NextResponse.json({ currency: user?.currency || "CNY" });
    } catch (error) {
        console.error("GET /api/user/settings error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as { id?: string })?.id;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { currency } = body;

        if (!currency || !CURRENCIES.includes(currency)) {
            return NextResponse.json(
                { error: "Invalid currency" },
                { status: 400 }
            );
        }

        await prisma.user.update({
            where: { id: userId },
            data: { currency },
        });

        return NextResponse.json({ currency });
    } catch (error) {
        console.error("PATCH /api/user/settings error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
