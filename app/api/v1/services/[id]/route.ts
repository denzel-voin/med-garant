import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getTenantContext } from "@/lib/api-helpers";
import { serviceSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const ctx = getTenantContext(req);
        if (!["OWNER", "ADMIN"].includes(ctx.role)) {
            return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
        }
        const { id } = await params;
        const service = await prisma.service.findFirst({ where: { id, tenantId: ctx.tenantId } });
        if (!service) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });

        const body = await req.json();
        const data = serviceSchema.parse(body);
        const updated = await prisma.service.update({ where: { id }, data });
        return NextResponse.json(updated);
    } catch (e) {
        if (e instanceof z.ZodError) {
            return NextResponse.json({ error: { code: "VALIDATION_ERROR", details: e.issues } }, { status: 400 });
        }
        const msg = e instanceof Error ? e.message : "";
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
        return NextResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        const ctx = getTenantContext(req);
        if (!["OWNER", "ADMIN"].includes(ctx.role)) {
            return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
        }
        const { id } = await params;
        const { isActive } = await req.json();
        const service = await prisma.service.findFirst({ where: { id, tenantId: ctx.tenantId } });
        if (!service) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });

        const updated = await prisma.service.update({ where: { id }, data: { isActive } });
        return NextResponse.json(updated);
    } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
        return NextResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 });
    }
}