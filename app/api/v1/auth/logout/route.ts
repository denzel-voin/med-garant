import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.service";
import { clearAuthCookies } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get("refresh_token")?.value;
        if (refreshToken) {
            await authService.logout(refreshToken);
        }
        await clearAuthCookies();
        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error("[logout]", e);
        return NextResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 });
    }
}