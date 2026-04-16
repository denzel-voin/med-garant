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
                        { patientName: { contains: search, mode: "insensitive" as const } },
                        { patientPhone: { contains: search } },
                        { patientEmail: { contains: search, mode: "insensitive" as const } },
                    ],
                }
                : {}),
        };

        const appointments = await prisma.appointment.findMany({
            where,
            orderBy: { startTime: "desc" },
            include: {
                doctor: { select: { name: true } },
                service: { select: { name: true } },
            },
        });

        const groups = new Map<
            string,
            {
                id: string;
                fullName: string;
                phone: string;
                email: string | null;
                notes: string | null;
                createdAt: Date;
                appointments: Array<{
                    id: string;
                    startTime: Date;
                    status: string;
                    doctor: { name: string };
                    service: { name: string };
                }>;
            }
        >();

        for (const a of appointments) {
            const key = `${a.patientName}::${a.patientPhone ?? ""}::${a.patientEmail ?? ""}`;
            const id = Buffer.from(key).toString("base64url");
            const existing = groups.get(key);

            if (!existing) {
                groups.set(key, {
                    id,
                    fullName: a.patientName,
                    phone: a.patientPhone ?? "",
                    email: a.patientEmail ?? null,
                    notes: a.notes ?? null,
                    createdAt: a.createdAt,
                    appointments: [
                        {
                            id: a.id,
                            startTime: a.startTime,
                            status: a.status,
                            doctor: { name: a.doctor.name },
                            service: { name: a.service.name },
                        },
                    ],
                });
                continue;
            }

            existing.appointments.push({
                id: a.id,
                startTime: a.startTime,
                status: a.status,
                doctor: { name: a.doctor.name },
                service: { name: a.service.name },
            });

            if (a.createdAt < existing.createdAt) existing.createdAt = a.createdAt;
            if (!existing.notes && a.notes) existing.notes = a.notes;
        }

        const allPatients = Array.from(groups.values()).sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );
        const total = allPatients.length;
        const start = (page - 1) * limit;
        const patients = allPatients.slice(start, start + limit).map((p) => ({
            ...p,
            appointments: p.appointments.slice(0, 5),
        }));

        return NextResponse.json({
            patients,
            total,
            page,
            pages: Math.max(1, Math.ceil(total / limit)),
        });
    } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
        console.error("[patients GET]", e);
        return NextResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 });
    }
}