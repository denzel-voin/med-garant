import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getTenantContext } from "@/lib/api-helpers";

const updateSchema = z.object({
    name: z.string().min(2).optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    logo: z.string().url().optional().or(z.literal("")),
    primaryColor: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, "Неверный формат цвета (#RRGGBB)")
        .optional(),
});

export async function GET(req: NextRequest) {
    try {
        const ctx = getTenantContext(req);
        const tenant = await prisma.tenant.findUnique({
            where: { id: ctx.tenantId },
            select: {
                id: true, name: true, slug: true, email: true,
                address: true, phone: true, logo: true, primaryColor: true,
            },
        });
        if (!tenant) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
        return NextResponse.json(tenant);
    } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
        return NextResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const ctx = getTenantContext(req);
        if (!["OWNER", "ADMIN"].includes(ctx.role)) {
            return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
        }
        const body = await req.json();
        const data = updateSchema.parse(body);

        const updated = await prisma.tenant.update({
            where: { id: ctx.tenantId },
            data,
            select: {
                id: true, name: true, slug: true, email: true,
                address: true, phone: true, logo: true, primaryColor: true,
            },
        });
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