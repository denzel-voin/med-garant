import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authService } from "@/services/auth.service";
import { setAuthCookies } from "@/lib/auth";

const schema = z.object({
    clinicName: z.string().min(2, "Название клиники слишком короткое"),
    slug: z
        .string()
        .min(3)
        .max(50)
        .regex(/^[a-z0-9-]+$/, "Только строчные латинские буквы, цифры и дефис"),
    email: z.string().email("Некорректный email"),
    password: z.string().min(8, "Минимум 8 символов"),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const data = schema.parse(body);
        const result = await authService.register(data);
        await setAuthCookies(result.accessToken, result.refreshToken);
        return NextResponse.json({ user: result.user }, { status: 201 });
    } catch (e: unknown) {
        if (e instanceof z.ZodError) {
            return NextResponse.json(
                { error: { code: "VALIDATION_ERROR", details: e.errors } },
                { status: 400 }
            );
        }
        const msg = e instanceof Error ? e.message : "UNKNOWN";
        if (msg === "SLUG_TAKEN")
            return NextResponse.json(
                { error: { code: "SLUG_TAKEN", message: "Этот адрес уже занят" } },
                { status: 409 }
            );
        if (msg === "EMAIL_TAKEN")
            return NextResponse.json(
                { error: { code: "EMAIL_TAKEN", message: "Email уже зарегистрирован" } },
                { status: 409 }
            );
        console.error("[register]", e);
        return NextResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 });
    }
}