import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTenantContext } from "@/lib/api-helpers";
import { blockSchema } from "@/lib/validators";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const ctx = getTenantContext(req);
        const { id } = await params;
        const doctor = await prisma.doctor.findFirst({ where: { id, tenantId: ctx.tenantId } });
        if (!doctor) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
        const blocks = await prisma.scheduleBlock.findMany({
            where: { doctorId: id, date: { gte: new Date() } },
            orderBy: { date: "asc" },
        });
        return NextResponse.json(blocks);
    } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
        return NextResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: Params) {
    try {
        const ctx = getTenantContext(req);
        if (!["OWNER", "ADMIN", "DOCTOR"].includes(ctx.role)) {
            return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
        }
        const { id } = await params;
        const doctor = await prisma.doctor.findFirst({ where: { id, tenantId: ctx.tenantId } });
        if (!doctor) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });

        const body = await req.json();
        const data = blockSchema.parse(body);
        const block = await prisma.scheduleBlock.create({
            data: { ...data, date: new Date(data.date), doctorId: id },
        });
        return NextResponse.json(block, { status: 201 });
    } catch (e) {
        if (e instanceof z.ZodError) return NextResponse.json({ error: { code: "VALIDATION_ERROR", details: e.errors } }, { status: 400 });
        const msg = e instanceof Error ? e.message : "";
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
        return NextResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 });
    }
}