import { prisma } from "@/lib/db";

export interface Slot {
    startTime: string;
    endTime: string;
    startDateTime: Date;
    endDateTime: Date;
}

export function toMinutes(t: string): number {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
}

export function fromMinutes(m: number): string {
    const h = Math.floor(m / 60).toString().padStart(2, "0");
    const min = (m % 60).toString().padStart(2, "0");
    return `${h}:${min}`;
}

export function combineDateTime(date: Date, time: string): Date {
    const [h, m] = time.split(":").map(Number);
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    return d;
}

function startOfDay(d: Date): Date {
    const r = new Date(d);
    r.setHours(0, 0, 0, 0);
    return r;
}

function endOfDay(d: Date): Date {
    const r = new Date(d);
    r.setHours(23, 59, 59, 999);
    return r;
}

export function overlaps(s1: Date, e1: Date, s2: Date, e2: Date): boolean {
    return s1 < e2 && e1 > s2;
}

export async function generateSlots(
    doctorId: string,
    tenantId: string,
    serviceId: string,
    date: Date
): Promise<Slot[]> {
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service || !service.isActive) return [];
    const duration = service.duration;

    const dayOfWeek = date.getDay();
    const schedule = await prisma.schedule.findFirst({
        where: { doctorId, isActive: true, weekday: dayOfWeek },
    });
    if (!schedule) return [];

    const start = toMinutes(schedule.startTime);
    const end = toMinutes(schedule.endTime);
    const slots: Slot[] = [];
    for (let t = start; t + duration <= end; t += duration) {
        const slotStart = combineDateTime(date, fromMinutes(t));
        const slotEnd = combineDateTime(date, fromMinutes(t + duration));
        slots.push({
            startTime: fromMinutes(t),
            endTime: fromMinutes(t + duration),
            startDateTime: slotStart,
            endDateTime: slotEnd,
        });
    }

    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const [appointments, blocks] = await Promise.all([
        prisma.appointment.findMany({
            where: {
                doctorId,
                tenantId,
                startTime: { gte: dayStart, lte: dayEnd },
                status: { in: ["PENDING", "CONFIRMED"] },
            },
        }),
        prisma.scheduleBlock.findMany({
            where: { doctorId, date: dayStart },
        }),
    ]);

    const occupied: Array<{ s: Date; e: Date }> = [
        ...appointments.map((a) => ({ s: a.startTime, e: a.endTime })),
        ...blocks.map((b) => ({
            s: combineDateTime(date, b.startTime),
            e: combineDateTime(date, b.endTime),
        })),
    ];

    const now = new Date();
    const buffer = new Date(now.getTime() + 30 * 60 * 1000);

    return slots.filter(
        (slot) =>
            slot.startDateTime >= buffer &&
            !occupied.some((o) => overlaps(slot.startDateTime, slot.endDateTime, o.s, o.e))
    );
}