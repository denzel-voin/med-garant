import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTenantContext } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
    try {
        const ctx = getTenantContext(req);
        if (ctx.role !== "PATIENT") {
            return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
        }

        const appointments = await prisma.appointment.findMany({
            where: { patientUserId: ctx.userId },
            orderBy: { startTime: "desc" },
            include: {
                doctor: { select: { id: true, name: true, speciality: true, avatarUrl: true } },
                service: { select: { id: true, name: true, duration: true, price: true } },
                tenant: { select: { id: true, name: true, slug: true, address: true, logo: true } },
                review: { select: { id: true, rating: true, comment: true, createdAt: true } },
            },
        });

        return NextResponse.json(appointments);
    } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
        console.error("[patient/appointments]", e);
        return NextResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 });
    }
}