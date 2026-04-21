import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyAccessToken } from "@/lib/auth";
import { sendConfirmationEmail, sendClinicNotification } from "@/lib/email";

const schema = z.object({
    doctorId: z.string().uuid(),
    serviceId: z.string().uuid(),
    startTime: z.string().datetime(),
    patientName: z.string().min(2),
    patientPhone: z.string().optional(),
    patientEmail: z.string().email().optional().or(z.literal("")),
    notes: z.string().max(500).optional(),
    linkToPatientAccount: z.boolean().optional(),
});

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const body = await req.json();
        const data = schema.parse(body);

        let patientUserId: string | null = null;
        if (data.linkToPatientAccount) {
            const rawToken = req.cookies.get("access_token")?.value;
            if (rawToken) {
                try {
                    const payload = await verifyAccessToken(rawToken);
                    if (payload.role === "PATIENT") {
                        patientUserId = payload.userId;
                    }
                } catch {}
            }
        }

        const tenant = await prisma.tenant.findUnique({
            where: { slug },
            select: { id: true, name: true, email: true },
        });
        if (!tenant) {
            return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
        }

        const [doctor, service] = await Promise.all([
            prisma.doctor.findFirst({ where: { id: data.doctorId, tenantId: tenant.id, isActive: true } }),
            prisma.service.findFirst({ where: { id: data.serviceId, tenantId: tenant.id, isActive: true } }),
        ]);
        if (!doctor || !service) {
            return NextResponse.json({ error: { code: "NOT_FOUND", message: "Врач или услуга не найдены" } }, { status: 404 });
        }

        const startTime = new Date(data.startTime);
        const endTime = new Date(startTime.getTime() + service.duration * 60 * 1000);

        const appointment = await prisma.$transaction(async (tx) => {
            const conflict = await tx.appointment.findFirst({
                where: {
                    doctorId: data.doctorId,
                    status: { in: ["PENDING", "CONFIRMED"] },
                    OR: [
                        { startTime: { lte: startTime }, endTime: { gt: startTime } },
                        { startTime: { lt: endTime }, endTime: { gte: endTime } },
                        { startTime: { gte: startTime }, endTime: { lte: endTime } },
                    ],
                },
            });

            if (conflict) throw new Error("SLOT_TAKEN");

            return tx.appointment.create({
                data: {
                    startTime,
                    endTime,
                    patientName: data.patientName,
                    patientPhone: data.patientPhone,
                    patientEmail: data.patientEmail || null,
                    notes: data.notes,
                    tenantId: tenant.id,
                    doctorId: data.doctorId,
                    serviceId: data.serviceId,
                    status: "PENDING",
                    patientUserId: patientUserId ?? undefined,
                },
            });
        });

        const emailPromises: Promise<void>[] = [];

        if (appointment.patientEmail) {
            emailPromises.push(
                sendConfirmationEmail({
                    to: appointment.patientEmail,
                    patientName: appointment.patientName,
                    clinicName: tenant.name,
                    doctorName: doctor.name,
                    serviceName: service.name,
                    startTime: appointment.startTime,
                    cancelToken: appointment.cancelToken,
                }).catch((e) => console.error("[email:confirmation]", e))
            );
        }

        if (tenant.email) {
            emailPromises.push(
                sendClinicNotification({
                    to: tenant.email,
                    clinicName: tenant.name,
                    patientName: appointment.patientName,
                    doctorName: doctor.name,
                    serviceName: service.name,
                    startTime: appointment.startTime,
                }).catch((e) => console.error("[email:clinic]", e))
            );
        }

        Promise.all(emailPromises);

        return NextResponse.json(
            {
                id: appointment.id,
                startTime: appointment.startTime,
                endTime: appointment.endTime,
                status: appointment.status,
                cancelToken: appointment.cancelToken,
                linkedToAccount: patientUserId !== null,
            },
            { status: 201 }
        );
    } catch (e: unknown) {
        if (e instanceof z.ZodError) {
            return NextResponse.json({ error: { code: "VALIDATION_ERROR", details: e.issues } }, { status: 400 });
        }
        const msg = e instanceof Error ? e.message : "";
        if (msg === "SLOT_TAKEN") {
            return NextResponse.json(
                { error: { code: "SLOT_TAKEN", message: "Это время уже занято. Выберите другой слот." } },
                { status: 409 }
            );
        }
        console.error("[booking]", e);
        return NextResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 });
    }
}