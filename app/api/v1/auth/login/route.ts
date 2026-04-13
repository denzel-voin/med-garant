import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authService } from "@/services/auth.service";
import { setAuthCookies } from "@/lib/auth";

const schema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password } = schema.parse(body);
        const result = await authService.login(email, password);
        await setAuthCookies(result.accessToken, result.refreshToken);
        return NextResponse.json({ user: result.user });
    } catch (e: unknown) {
        if (e instanceof z.ZodError) {
            return NextResponse.json({ error: { code: "VALIDATION_ERROR", details: e.errors } }, { status: 400 });
        }
        const msg = e instanceof Error ? e.message : "";
        if (msg === "INVALID_CREDENTIALS") {
            return NextResponse.json({ error: { code: "INVALID_CREDENTIALS", message: "Неверный email или пароль" } }, { status: 401 });
        }
        console.error("[login]", e);
        return NextResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 });
    }
}