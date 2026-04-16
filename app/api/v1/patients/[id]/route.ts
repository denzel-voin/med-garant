import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTenantContext } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        const ctx = getTenantContext(req);
        const { id } = await params;
        const { notes } = await req.json();
        const decoded = Buffer.from(id, "base64url").toString("utf8");
        const [patientName, patientPhone, patientEmail] = decoded.split("::");
        if (!patientName) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });

        const where = {
            tenantId: ctx.tenantId,
            patientName,
            patientPhone: patientPhone || null,
            patientEmail: patientEmail || null,
        };

        const latest = await prisma.appointment.findFirst({
            where,
            orderBy: { createdAt: "desc" },
            select: { id: true },
        });
        if (!latest) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });

        await prisma.appointment.update({ where: { id: latest.id }, data: { notes: notes ?? null } });
        return NextResponse.json({ ok: true });
    } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
        return NextResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 });
    }
}