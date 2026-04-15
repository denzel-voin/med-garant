import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTenantContext } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
    try {
        const ctx = getTenantContext(req);
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") ?? "";
        const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
        const limit = 20;

        const where = {
            tenantId: ctx.tenantId,
            ...(search
                ? {
                    OR: [
                        { fullName: { contains: search, mode: "insensitive" as const } },
                        { phone: { contains: search } },
                        { email: { contains: search, mode: "insensitive" as const } },
                    ],
                }
                : {}),
        };

        const [patients, total] = await Promise.all([
            prisma.patient.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    appointments: {
                        orderBy: { startTime: "desc" },
                        take: 5,
                        include: {
                            doctor: { select: { name: true } },
                            service: { select: { name: true } },
                        },
                    },
                },
            }),
            prisma.patient.count({ where }),
        ]);

        return NextResponse.json({ patients, total, page, pages: Math.ceil(total / limit) });
    } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
        console.error("[patients GET]", e);
        return NextResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 });
    }
}