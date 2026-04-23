import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const ACCESS_SECRET = new TextEncoder().encode(
    process.env.JWT_ACCESS_SECRET ?? "dev-access-secret-min-32-chars!!"
);

const PUBLIC_PATHS = [
    "/",
    "/login",
    "/register",
    "/register-patient",
    "/login-patient",
];

function isPublicApi(pathname: string, method: string): boolean {
    return (
        pathname.startsWith("/api/v1/auth/") ||
        pathname.startsWith("/api/v1/tenants/") ||
        pathname.startsWith("/api/v1/ai/") ||
        pathname === "/api/v1/appointments/cancel" ||
        (method === "GET" && pathname.match(/^\/api\/v1\/doctors\/[^/]+\/reviews$/) !== null)
    );
}

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();
    if (isPublicApi(pathname, req.method)) return NextResponse.next();

    if (
        pathname.startsWith("/widget/") ||
        pathname.startsWith("/uploads/") ||
        pathname.match(/^\/[a-z0-9-]+$/)
    ) {
        return NextResponse.next();
    }

    const token = req.cookies.get("access_token")?.value;

    if (!token) {
        if (pathname.startsWith("/api/")) {
            return NextResponse.json(
                { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
                { status: 401 }
            );
        }
        if (pathname.startsWith("/me")) {
            return NextResponse.redirect(new URL("/login-patient", req.url));
        }
        return NextResponse.redirect(new URL("/login", req.url));
    }

    try {
        const { payload } = await jwtVerify(token, ACCESS_SECRET);
        const res = NextResponse.next();
        res.headers.set("x-user-id", payload.userId as string);
        res.headers.set("x-tenant-id", payload.tenantId as string);
        res.headers.set("x-user-role", payload.role as string);
        return res;
    } catch {
        if (pathname.startsWith("/api/")) {
            return NextResponse.json(
                { error: { code: "UNAUTHORIZED", message: "Invalid token" } },
                { status: 401 }
            );
        }
        if (pathname.startsWith("/me")) {
            return NextResponse.redirect(new URL("/login-patient", req.url));
        }
        return NextResponse.redirect(new URL("/login", req.url));
    }
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|public|uploads).*)"],
};