import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.service";
import { setAuthCookies } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get("refresh_token")?.value;
        if (!refreshToken) {
            return NextResponse.json({ error: { code: "NO_REFRESH_TOKEN" } }, { status: 401 });
        }
        const result = await authService.refresh(refreshToken);
        await setAuthCookies(result.accessToken, result.refreshToken);
        return NextResponse.json({ user: result.user });
    } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "INVALID_REFRESH_TOKEN") {
            return NextResponse.json({ error: { code: "INVALID_REFRESH_TOKEN" } }, { status: 401 });
        }
        console.error("[refresh]", e);
        return NextResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 });
    }
}