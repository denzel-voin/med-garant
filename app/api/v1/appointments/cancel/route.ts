import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendCancellationEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
    const token = new URL(req.url).searchParams.get("token");
    if (!token) {
        return NextResponse.json({ error: { code: "MISSING_TOKEN" } }, { status: 400 });
    }

    const appointment = await prisma.appointment.findUnique({
        where: { cancelToken: token },
        include: {
            tenant: { select: { name: true } },
            doctor: { select: { name: true } },
        },
    });

    if (!appointment) {
        return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    }

    if (appointment.status !== "PENDING" && appointment.status !== "CONFIRMED") {
        return NextResponse.json(
            { error: { code: "ALREADY_CANCELLED", message: "Запись уже отменена или завершена" } },
            { status: 400 }
        );
    }

    await prisma.appointment.update({
        where: { id: appointment.id },
        data: { status: "CANCELLED_BY_PATIENT" },
    });

    if (appointment.patientEmail) {
        sendCancellationEmail({
            to: appointment.patientEmail,
            patientName: appointment.patientName,
            clinicName: appointment.tenant.name,
            startTime: appointment.startTime,
            byClinic: false,
        }).catch((e) => console.error("[cancel email]", e));
    }

    return NextResponse.redirect(new URL("/cancelled", req.url));
}