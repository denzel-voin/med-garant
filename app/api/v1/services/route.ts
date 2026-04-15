import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getTenantContext } from "@/lib/api-helpers";
import { serviceSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
    try {
        const ctx = getTenantContext(req);
        const services = await prisma.service.findMany({
            where: { tenantId: ctx.tenantId },
            orderBy: { name: "asc" },
        });
        return NextResponse.json(services);
    } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
        return NextResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const ctx = getTenantContext(req);
        if (!["OWNER", "ADMIN"].includes(ctx.role)) {
            return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
        }
        const body = await req.json();
        const data = serviceSchema.parse(body);
        const service = await prisma.service.create({
            data: { ...data, tenantId: ctx.tenantId },
        });
        return NextResponse.json(service, { status: 201 });
    } catch (e) {
        if (e instanceof z.ZodError) return NextResponse.json({ error: { code: "VALIDATION_ERROR", details: e.issues } }, { status: 400 });
        const msg = e instanceof Error ? e.message : "";
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
        return NextResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 });
    }
}