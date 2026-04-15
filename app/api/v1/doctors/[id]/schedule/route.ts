import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTenantContext } from "@/lib/api-helpers";
import { scheduleSchema } from "@/lib/validators";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const ctx = getTenantContext(req);
        const { id } = await params;
        const doctor = await prisma.doctor.findFirst({ where: { id, tenantId: ctx.tenantId } });
        if (!doctor) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });

        const schedules = await prisma.schedule.findMany({ where: { doctorId: id }, orderBy: { weekday: "asc" } });
        return NextResponse.json(schedules);
    } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
        return NextResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const ctx = getTenantContext(req);
        if (!["OWNER", "ADMIN", "DOCTOR"].includes(ctx.role)) {
            return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
        }
        const { id } = await params;
        const doctor = await prisma.doctor.findFirst({ where: { id, tenantId: ctx.tenantId } });
        if (!doctor) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });

        if (ctx.role === "DOCTOR" && doctor.userId !== ctx.userId) {
            return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
        }

        const body = await req.json();
        const rows = scheduleSchema.parse(body);

        const updated = await prisma.$transaction([
            prisma.schedule.deleteMany({ where: { doctorId: id } }),
            prisma.schedule.createMany({
                data: rows.map((r) => ({ ...r, doctorId: id })),
            }),
        ]);

        return NextResponse.json({ count: updated[1].count });
    } catch (e) {
        if (e instanceof z.ZodError) return NextResponse.json({ error: { code: "VALIDATION_ERROR", details: e.issues } }, { status: 400 });
        const msg = e instanceof Error ? e.message : "";
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
        return NextResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 });
    }
}