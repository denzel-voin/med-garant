import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTenantContext } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
    try {
        const ctx = getTenantContext(req);
        const { searchParams } = new URL(req.url);

        const where: Record<string, unknown> = { tenantId: ctx.tenantId };

        if (ctx.role === "DOCTOR") {
            const doctor = await prisma.doctor.findFirst({ where: { userId: ctx.userId, tenantId: ctx.tenantId } });
            if (doctor) where.doctorId = doctor.id;
        }

        const from = searchParams.get("from");
        const to = searchParams.get("to");
        const doctorId = searchParams.get("doctorId");
        const status = searchParams.get("status");

        if (from || to) {
            where.startTime = {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
            };
        }
        if (doctorId && ctx.role !== "DOCTOR") where.doctorId = doctorId;
        if (status) where.status = status;

        const appointments = await prisma.appointment.findMany({
            where,
            orderBy: { startTime: "asc" },
            include: {
                doctor: { select: { id: true, name: true, speciality: true } },
                service: { select: { id: true, name: true, duration: true } },
            },
        });

        return NextResponse.json(appointments);
    } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
        console.error("[appointments GET]", e);
        return NextResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 });
    }
}