import { NextRequest } from "next/server";

export interface TenantContext {
    userId: string;
    tenantId: string;
    role: string;
}

export function getTenantContext(req: NextRequest): TenantContext {
    const userId = req.headers.get("x-user-id");
    const tenantId = req.headers.get("x-tenant-id");
    const role = req.headers.get("x-user-role");

    if (!userId || !tenantId || !role) {
        throw new Error("UNAUTHORIZED");
    }

    return { userId, tenantId, role };
}

export function requireRole(ctx: TenantContext, ...roles: string[]) {
    if (!roles.includes(ctx.role)) {
        throw new Error("FORBIDDEN");
    }
}

export function apiError(code: string, message: string, status: number) {
    const { NextResponse } = require("next/server");
    return NextResponse.json({ error: { code, message } }, { status });
}