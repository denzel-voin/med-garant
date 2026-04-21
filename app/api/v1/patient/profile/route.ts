import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTenantContext } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
    try {
        const ctx = getTenantContext(req);
        if (ctx.role !== "PATIENT") {
            return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
        }

        const profile = await prisma.patientProfile.findUnique({
            where: { userId: ctx.userId },
        });
        if (!profile) {
            return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
        }

        return NextResponse.json({ ...profile, userId: ctx.userId });
    } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
        return NextResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 });
    }
}