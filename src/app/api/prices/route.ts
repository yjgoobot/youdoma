import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDictionary } from "@/i18n/server";

export async function GET() {
    try {
        const dict = await getDictionary();
        const session = await getServerSession(authOptions);

        const userId = (session?.user as { id?: string })?.id;
        if (!userId) {
            return NextResponse.json({ error: dict.api_msgs.unauthorized }, { status: 401 });
        }

        const prices = await prisma.domainPrice.findMany({
            where: { userId },
            orderBy: [{ registrar: "asc" }, { tld: "asc" }],
        });

        return NextResponse.json(prices);
    } catch (error) {
        console.error("GET /api/prices error:", error);
        const dict = await getDictionary();
        return NextResponse.json(
            { error: dict.api_msgs.prices_fetch_error },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const dict = await getDictionary();
        const session = await getServerSession(authOptions);

        const userId = (session?.user as { id?: string })?.id;
        if (!userId) {
            return NextResponse.json({ error: dict.api_msgs.unauthorized }, { status: 401 });
        }

        const body = await req.json();
        const { registrar, tld, price } = body;

        if (!registrar || !tld || typeof price !== "number") {
            return NextResponse.json(
                { error: dict.api_msgs.prices_invalid_params },
                { status: 400 }
            );
        }

        const priceRecord = await prisma.domainPrice.upsert({
            where: {
                userId_registrar_tld: {
                    userId,
                    registrar,
                    tld,
                },
            },
            update: { price },
            create: {
                userId,
                registrar,
                tld,
                price,
            },
        });

        return NextResponse.json(priceRecord);
    } catch (error) {
        console.error("POST /api/prices error:", error);
        const dict = await getDictionary();
        return NextResponse.json(
            { error: dict.api_msgs.prices_save_error },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request) {
    try {
        const dict = await getDictionary();
        const session = await getServerSession(authOptions);

        const userId = (session?.user as { id?: string })?.id;
        if (!userId) {
            return NextResponse.json({ error: dict.api_msgs.unauthorized }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: dict.api_msgs.prices_missing_id },
                { status: 400 }
            );
        }

        const priceRecord = await prisma.domainPrice.findUnique({
            where: { id },
        });

        if (!priceRecord || priceRecord.userId !== userId) {
            return NextResponse.json({ error: dict.api_msgs.unauthorized }, { status: 403 });
        }

        await prisma.domainPrice.delete({
            where: { id },
        });

        return NextResponse.json({ message: dict.api_msgs.prices_deleted });
    } catch (error) {
        console.error("DELETE /api/prices error:", error);
        const dict = await getDictionary();
        return NextResponse.json(
            { error: dict.api_msgs.prices_delete_error },
            { status: 500 }
        );
    }
}
