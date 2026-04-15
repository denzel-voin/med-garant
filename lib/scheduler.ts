import cron from "node-cron";
import { prisma } from "@/lib/db";
import { sendReminderEmail } from "@/lib/email";

let initialized = false;

export function initScheduler() {
    if (initialized) return;
    initialized = true;

    cron.schedule("0 * * * *", async () => {
        console.log("[scheduler] Running reminder jobs...");
        await Promise.all([sendReminder24h(), sendReminder2h()]);
    });

    console.log("[scheduler] Reminder cron initialized");
}

async function sendReminder24h() {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const appointments = await prisma.appointment.findMany({
        where: {
            startTime: { gte: windowStart, lte: windowEnd },
            status: { in: ["PENDING", "CONFIRMED"] },
            reminderSent24h: false,
            patientEmail: { not: null },
        },
        include: {
            tenant: { select: { name: true } },
            doctor: { select: { name: true } },
        },
    });

    for (const apt of appointments) {
        if (!apt.patientEmail) continue;
        try {
            await sendReminderEmail({
                to: apt.patientEmail,
                patientName: apt.patientName,
                clinicName: apt.tenant.name,
                doctorName: apt.doctor.name,
                startTime: apt.startTime,
                hoursLeft: 24,
            });
            await prisma.appointment.update({
                where: { id: apt.id },
                data: { reminderSent24h: true },
            });
            console.log(`[scheduler] 24h reminder sent → ${apt.patientEmail}`);
        } catch (e) {
            console.error(`[scheduler] Failed 24h reminder for ${apt.id}:`, e);
        }
    }
}

async function sendReminder2h() {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 90 * 60 * 1000);   // now + 1.5h
    const windowEnd = new Date(now.getTime() + 150 * 60 * 1000);    // now + 2.5h

    const appointments = await prisma.appointment.findMany({
        where: {
            startTime: { gte: windowStart, lte: windowEnd },
            status: { in: ["PENDING", "CONFIRMED"] },
            reminderSent2h: false,
            patientEmail: { not: null },
        },
        include: {
            tenant: { select: { name: true } },
            doctor: { select: { name: true } },
        },
    });

    for (const apt of appointments) {
        if (!apt.patientEmail) continue;
        try {
            await sendReminderEmail({
                to: apt.patientEmail,
                patientName: apt.patientName,
                clinicName: apt.tenant.name,
                doctorName: apt.doctor.name,
                startTime: apt.startTime,
                hoursLeft: 2,
            });
            await prisma.appointment.update({
                where: { id: apt.id },
                data: { reminderSent2h: true },
            });
            console.log(`[scheduler] 2h reminder sent → ${apt.patientEmail}`);
        } catch (e) {
            console.error(`[scheduler] Failed 2h reminder for ${apt.id}:`, e);
        }
    }
}