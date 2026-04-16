import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTenantContext } from "@/lib/api-helpers";
import { format, eachDayOfInterval, startOfDay } from "date-fns";

export async function GET(req: NextRequest) {
    try {
        const ctx = getTenantContext(req);
        const { searchParams } = new URL(req.url);

        const now = new Date();
        const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1); // start of month
        const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59); // end of month

        const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : defaultFrom;
        const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : defaultTo;

        const tenantId = ctx.tenantId;

        const appointments = await prisma.appointment.findMany({
            where: {
                tenantId,
                startTime: { gte: from, lte: to },
            },
            include: {
                service: { select: { id: true, name: true } },
                doctor: { select: { id: true, name: true } },
            },
        });

        const total = appointments.length;
        const confirmed = appointments.filter((a) => a.status === "CONFIRMED").length;
        const completed = appointments.filter((a) => a.status === "COMPLETED").length;
        const cancelled = appointments.filter((a) =>
            ["CANCELLED_BY_PATIENT", "CANCELLED_BY_CLINIC"].includes(a.status)
        ).length;
        const noShow = appointments.filter((a) => a.status === "NO_SHOW").length;

        const finalized = completed + noShow;
        const noShowRate = finalized > 0 ? Math.round((noShow / finalized) * 100) : 0;

        const days = eachDayOfInterval({ start: from, end: to });
        const bookingsByDay = days.map((day) => {
            const dayStr = format(day, "dd.MM");
            const count = appointments.filter(
                (a) => format(new Date(a.startTime), "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
            ).length;
            return { date: dayStr, count };
        });

        const serviceCounts: Record<string, { name: string; count: number }> = {};
        for (const a of appointments) {
            const { id, name } = a.service;
            if (!serviceCounts[id]) serviceCounts[id] = { name, count: 0 };
            serviceCounts[id].count++;
        }
        const topServices = Object.values(serviceCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        const doctors = await prisma.doctor.findMany({
            where: { tenantId, isActive: true },
            include: { schedules: { where: { isActive: true } } },
        });

        const doctorWorkload = doctors.map((doc) => {
            const doctorApts = appointments.filter((a) => a.doctorId === doc.id);
            const workingDays = days.filter((d) => {
                const dow = d.getDay();
                return doc.schedules.some((s) => s.weekday === dow);
            }).length;
            const estimatedCapacity = workingDays * 8; // rough 8 slots/day
            const pct = estimatedCapacity > 0 ? Math.min(100, Math.round((doctorApts.length / estimatedCapacity) * 100)) : 0;
            return { name: doc.name, bookings: doctorApts.length, capacityPct: pct };
        });

        return NextResponse.json({
            summary: { total, confirmed, completed, cancelled, noShow, noShowRate },
            bookingsByDay,
            topServices,
            doctorWorkload,
        });
    } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
        console.error("[analytics]", e);
        return NextResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 });
    }
}