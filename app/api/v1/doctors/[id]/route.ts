import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getTenantContext } from "@/lib/api-helpers";
import { doctorSchema } from "@/lib/validators";
import { sendCancellationEmail } from "@/lib/email";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const ctx = getTenantContext(req);
        const { id } = await params;
        const doctor = await prisma.doctor.findFirst({
            where: { id, tenantId: ctx.tenantId },
            include: {
                services: { where: { isActive: true } },
                schedules: true,
                blocks: { where: { date: { gte: new Date() } } },
            },
        });
        if (!doctor) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
        return NextResponse.json(doctor);
    } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
        return NextResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const ctx = getTenantContext(req);
        if (!["OWNER", "ADMIN"].includes(ctx.role)) return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
        const { id } = await params;
        const body = await req.json();
        const data = doctorSchema.parse(body);

        const doctor = await prisma.doctor.findFirst({ where: { id, tenantId: ctx.tenantId } });
        if (!doctor) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });

        const updated = await prisma.doctor.update({ where: { id }, data });
        return NextResponse.json(updated);
    } catch (e) {
        if (e instanceof z.ZodError) return NextResponse.json({ error: { code: "VALIDATION_ERROR", details: e.errors } }, { status: 400 });
        const msg = e instanceof Error ? e.message : "";
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
        return NextResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        const ctx = getTenantContext(req);
        if (!["OWNER", "ADMIN"].includes(ctx.role)) return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
        const { id } = await params;
        const { isActive } = await req.json();

        const doctor = await prisma.doctor.findFirst({ where: { id, tenantId: ctx.tenantId } });
        if (!doctor) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });

        const updated = await prisma.doctor.update({ where: { id }, data: { isActive } });

        if (isActive === false) {
            const future = await prisma.appointment.findMany({
                where: {
                    doctorId: id,
                    tenantId: ctx.tenantId,
                    startTime: { gt: new Date() },
                    status: { in: ["PENDING", "CONFIRMED"] },
                },
                include: { tenant: { select: { name: true } } },
            });

            await prisma.appointment.updateMany({
                where: { id: { in: future.map((a) => a.id) } },
                data: { status: "CANCELLED_BY_CLINIC" },
            });

            // Notify patients
            for (const a of future) {
                if (a.patientEmail) {
                    sendCancellationEmail({
                        to: a.patientEmail,
                        patientName: a.patientName,
                        clinicName: a.tenant.name,
                        startTime: a.startTime,
                        byClinic: true,
                    }).catch(() => {});
                }
            }
        }

        return NextResponse.json(updated);
    } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
        return NextResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 });
    }
}