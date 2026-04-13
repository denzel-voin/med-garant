import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateSlots } from "@/lib/slots";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string; id: string }> }
) {
    try {
        const { slug, id: doctorId } = await params;
        const { searchParams } = new URL(req.url);
        const dateStr = searchParams.get("date");
        const serviceId = searchParams.get("serviceId");

        if (!dateStr || !serviceId) {
            return NextResponse.json(
                { error: { code: "MISSING_PARAMS", message: "Требуются date и serviceId" } },
                { status: 400 }
            );
        }

        const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } });
        if (!tenant) {
            return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
        }

        const doctor = await prisma.doctor.findFirst({
            where: { id: doctorId, tenantId: tenant.id, isActive: true },
        });
        if (!doctor) {
            return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
        }

        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            return NextResponse.json({ error: { code: "INVALID_DATE" } }, { status: 400 });
        }

        const slots = await generateSlots(doctorId, tenant.id, serviceId, date);
        return NextResponse.json({ slots: slots.map(s => ({ startTime: s.startTime, endTime: s.endTime })) });
    } catch (e) {
        console.error("[slots]", e);
        return NextResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 });
    }
}