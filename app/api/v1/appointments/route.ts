import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getTenantContext } from "@/lib/api-helpers";
import { sendCancellationEmail } from "@/lib/email";

const schema = z.object({
    status: z.enum(["CONFIRMED", "CANCELLED_BY_CLINIC", "COMPLETED", "NO_SHOW"]),
});

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const ctx = getTenantContext(req);
        const { id } = await params;
        const body = await req.json();
        const { status } = schema.parse(body);

        const appointment = await prisma.appointment.findFirst({
            where: { id, tenantId: ctx.tenantId },
            include: {
                tenant: { select: { name: true } },
                doctor: { select: { name: true } },
            },
        });

        if (!appointment) {
            return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
        }

        const updated = await prisma.appointment.update({
            where: { id },
            data: { status },
        });

        if (status === "CANCELLED_BY_CLINIC" && appointment.patientEmail) {
            sendCancellationEmail({
                to: appointment.patientEmail,
                patientName: appointment.patientName,
                clinicName: appointment.tenant.name,
                startTime: appointment.startTime,
                byClinic: true,
            }).catch((e) => console.error("[cancel email]", e));
        }

        return NextResponse.json(updated);
    } catch (e: unknown) {
        if (e instanceof z.ZodError) {
            return NextResponse.json({ error: { code: "VALIDATION_ERROR", details: e.errors } }, { status: 400 });
        }
        const msg = e instanceof Error ? e.message : "";
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
        console.error("[appointment PATCH]", e);
        return NextResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 });
    }
}