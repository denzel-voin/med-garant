import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authService } from "@/services/auth.service";
import { setAuthCookies } from "@/lib/auth";
import { registerSchema as schema } from "@/lib/validators";

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
                { error: { code: "VALIDATION_ERROR", details: e.issues } },
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