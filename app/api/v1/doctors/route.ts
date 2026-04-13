import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getTenantContext } from "@/lib/api-helpers";
import { doctorSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
    try {
        const ctx = getTenantContext(req);
        const doctors = await prisma.doctor.findMany({
            where: { tenantId: ctx.tenantId },
            include: {
                services: { where: { isActive: true }, select: { id: true, name: true, duration: true, price: true } },
                schedules: true,
            },
            orderBy: { name: "asc" },
        });
        return NextResponse.json(doctors);
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
        const data = doctorSchema.parse(body);

        const doctor = await prisma.doctor.create({
            data: { ...data, tenantId: ctx.tenantId },
        });
        return NextResponse.json(doctor, { status: 201 });
    } catch (e) {
        if (e instanceof z.ZodError) return NextResponse.json({ error: { code: "VALIDATION_ERROR", details: e.errors } }, { status: 400 });
        const msg = e instanceof Error ? e.message : "";
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
        return NextResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 });
    }
}