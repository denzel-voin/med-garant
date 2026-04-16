import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getTenantContext } from "@/lib/api-helpers";

const updateSchema = z.object({
    name: z.string().min(2).optional(),
    address: z.string().optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    phone: z.string().optional(),
    logo: z
        .string()
        .optional()
        .refine((v) => !v || v.startsWith("/") || /^https?:\/\//.test(v), "Неверный формат логотипа"),
    primaryColor: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, "Неверный формат цвета (#RRGGBB)")
        .optional(),
});

export async function GET(req: NextRequest) {
    try {
        const ctx = getTenantContext(req);
        let tenant: {
            id: string;
            name: string;
            slug: string;
            email: string | null;
            address: string | null;
            latitude: number | null;
            longitude: number | null;
            phone: string | null;
            logo: string | null;
            primaryColor: string;
        } | null = null;

        try {
            tenant = await prisma.tenant.findUnique({
                where: { id: ctx.tenantId },
                select: {
                    id: true, name: true, slug: true, email: true,
                    address: true, latitude: true, longitude: true, phone: true, logo: true, primaryColor: true,
                },
            });
        } catch {
            const fallback = await prisma.tenant.findUnique({
                where: { id: ctx.tenantId },
                select: {
                    id: true, name: true, slug: true, email: true,
                    address: true, phone: true, logo: true, primaryColor: true,
                },
            });
            tenant = fallback ? { ...fallback, latitude: null, longitude: null } : null;
        }

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

        let updated: {
            id: string;
            name: string;
            slug: string;
            email: string | null;
            address: string | null;
            latitude: number | null;
            longitude: number | null;
            phone: string | null;
            logo: string | null;
            primaryColor: string;
        };
        try {
            updated = await prisma.tenant.update({
                where: { id: ctx.tenantId },
                data,
                select: {
                    id: true, name: true, slug: true, email: true,
                    address: true, latitude: true, longitude: true, phone: true, logo: true, primaryColor: true,
                },
            });
        } catch {
            const { latitude: _lat, longitude: _lng, ...withoutCoords } = data;
            const fallback = await prisma.tenant.update({
                where: { id: ctx.tenantId },
                data: withoutCoords,
                select: {
                    id: true, name: true, slug: true, email: true,
                    address: true, phone: true, logo: true, primaryColor: true,
                },
            });
            updated = { ...fallback, latitude: null, longitude: null };
        }

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