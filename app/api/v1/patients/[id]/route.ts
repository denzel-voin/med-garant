import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTenantContext } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        const ctx = getTenantContext(req);
        const { id } = await params;
        const { notes } = await req.json();

        const patient = await prisma.patient.findFirst({ where: { id, tenantId: ctx.tenantId } });
        if (!patient) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });

        const updated = await prisma.patient.update({ where: { id }, data: { notes } });
        return NextResponse.json(updated);
    } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
        return NextResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 });
    }
}