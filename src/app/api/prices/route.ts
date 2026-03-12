import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        const userId = (session?.user as { id?: string })?.id;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const prices = await prisma.domainPrice.findMany({
            where: { userId },
            orderBy: [{ registrar: "asc" }, { tld: "asc" }],
        });

        return NextResponse.json(prices);
    } catch (error) {
        console.error("GET /api/prices error:", error);
        return NextResponse.json(
            { error: "获取价格配置失败" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        const userId = (session?.user as { id?: string })?.id;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { registrar, tld, price } = body;

        if (!registrar || !tld || typeof price !== "number") {
            return NextResponse.json(
                { error: "缺少必要参数或参数格式错误" },
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
        return NextResponse.json(
            { error: "保存价格配置失败" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        const userId = (session?.user as { id?: string })?.id;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "缺少价格配置 ID" },
                { status: 400 }
            );
        }

        const priceRecord = await prisma.domainPrice.findUnique({
            where: { id },
        });

        if (!priceRecord || priceRecord.userId !== userId) {
            return NextResponse.json({ error: "Unauthorized or Not Found" }, { status: 403 });
        }

        await prisma.domainPrice.delete({
            where: { id },
        });

        return NextResponse.json({ message: "删除成功" });
    } catch (error) {
        console.error("DELETE /api/prices error:", error);
        return NextResponse.json(
            { error: "删除价格配置失败" },
            { status: 500 }
        );
    }
}
