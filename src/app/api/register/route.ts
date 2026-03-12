import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getDictionary } from "@/i18n/server";

export const dynamic = "force-dynamic";


export async function POST(request: Request) {
    try {
        const dict = await getDictionary();
        const { name, email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: dict.auth_errors.email_password_empty },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: dict.auth_errors.password_too_short },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: dict.auth_errors.email_exists },
                { status: 409 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        return NextResponse.json(
            { message: dict.auth_errors.register_success, userId: user.id },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration error:", error);
        const dict = await getDictionary();
        return NextResponse.json(
            { error: dict.auth_errors.register_server_error },
            { status: 500 }
        );
    }
}
