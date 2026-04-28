import { generateSlots } from "@/lib/slots";

jest.mock("@/lib/db", () => ({
    prisma: {
        service: { findUnique: jest.fn() },
        schedule: { findFirst: jest.fn() },
        appointment: { findMany: jest.fn() },
        scheduleBlock: { findMany: jest.fn() },
    },
}));

import { prisma } from "@/lib/db";

const db = prisma as unknown as {
    service: { findUnique: jest.Mock };
    schedule: { findFirst: jest.Mock };
    appointment: { findMany: jest.Mock };
    scheduleBlock: { findMany: jest.Mock };
};

const TEST_DATE = new Date("2026-01-15T10:00:00.000Z");

const ACTIVE_SERVICE = { id: "s1", duration: 60, isActive: true };
const SCHEDULE_9_12 = { startTime: "09:00", endTime: "12:00", weekday: 4, isActive: true };

function apptSlot(startHour: number, endHour: number) {
    const pad = (h: number) => String(h).padStart(2, "0");
    return {
        startTime: new Date(`2026-01-15T${pad(startHour)}:00:00.000Z`),
        endTime: new Date(`2026-01-15T${pad(endHour)}:00:00.000Z`),
    };
}

describe("generateSlots — алгоритм генерации временны́х слотов", () => {
    beforeAll(() => {
        jest.useFakeTimers();
        // "now" = 08:00 UTC → buffer = 08:30 UTC
        jest.setSystemTime(new Date("2026-01-15T08:00:00.000Z"));
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        db.appointment.findMany.mockResolvedValue([]);
        db.scheduleBlock.findMany.mockResolvedValue([]);
    });


    test("01. услуга не найдена → []", async () => {
        db.service.findUnique.mockResolvedValue(null);
        expect(await generateSlots("d1", "t1", "s1", TEST_DATE)).toEqual([]);
    });

    test("02. услуга неактивна → []", async () => {
        db.service.findUnique.mockResolvedValue({ id: "s1", duration: 60, isActive: false });
        expect(await generateSlots("d1", "t1", "s1", TEST_DATE)).toEqual([]);
    });

    test("03. расписание на день отсутствует → []", async () => {
        db.service.findUnique.mockResolvedValue(ACTIVE_SERVICE);
        db.schedule.findFirst.mockResolvedValue(null);
        expect(await generateSlots("d1", "t1", "s1", TEST_DATE)).toEqual([]);
    });


    test("04. 3-часовое окно с 60-мин слотами → 3 слота", async () => {
        db.service.findUnique.mockResolvedValue(ACTIVE_SERVICE);
        db.schedule.findFirst.mockResolvedValue(SCHEDULE_9_12);
        const slots = await generateSlots("d1", "t1", "s1", TEST_DATE);
        expect(slots).toHaveLength(3);
        expect(slots[0].startTime).toBe("09:00");
        expect(slots[0].endTime).toBe("10:00");
        expect(slots[2].startTime).toBe("11:00");
        expect(slots[2].endTime).toBe("12:00");
    });

    test("05. 45-мин слоты в 2-часовом окне → 2 слота (45×3 > 120)", async () => {
        db.service.findUnique.mockResolvedValue({ id: "s1", duration: 45, isActive: true });
        db.schedule.findFirst.mockResolvedValue({ startTime: "09:00", endTime: "11:00", weekday: 4, isActive: true });
        // 09:00–09:45, 09:45–10:30 ✓; 10:30+45=11:15 > 11:00 ✗
        const slots = await generateSlots("d1", "t1", "s1", TEST_DATE);
        expect(slots).toHaveLength(2);
        expect(slots[1].startTime).toBe("09:45");
    });

    test("06. 90-мин слоты в 3-часовом окне → 2 слота", async () => {
        db.service.findUnique.mockResolvedValue({ id: "s1", duration: 90, isActive: true });
        db.schedule.findFirst.mockResolvedValue(SCHEDULE_9_12);
        // 09:00–10:30, 10:30–12:00 ✓
        const slots = await generateSlots("d1", "t1", "s1", TEST_DATE);
        expect(slots).toHaveLength(2);
        expect(slots[0].endTime).toBe("10:30");
        expect(slots[1].startTime).toBe("10:30");
    });

    test("07. длительность не делит окно нацело — неполный хвост отбрасывается", async () => {
        db.service.findUnique.mockResolvedValue({ id: "s1", duration: 45, isActive: true });
        db.schedule.findFirst.mockResolvedValue({ startTime: "09:00", endTime: "10:00", weekday: 4, isActive: true });
        // 09:00–09:45 ✓; 09:45+45=10:30 > 10:00 ✗
        const slots = await generateSlots("d1", "t1", "s1", TEST_DATE);
        expect(slots).toHaveLength(1);
        expect(slots[0].startTime).toBe("09:00");
    });

    // ── Фильтрация по записям ───────────────────────────────────────────────

    test("08. слот занят PENDING-записью → исключается", async () => {
        db.service.findUnique.mockResolvedValue(ACTIVE_SERVICE);
        db.schedule.findFirst.mockResolvedValue(SCHEDULE_9_12);
        db.appointment.findMany.mockResolvedValue([apptSlot(9, 10)]);
        const slots = await generateSlots("d1", "t1", "s1", TEST_DATE);
        expect(slots).toHaveLength(2);
        expect(slots[0].startTime).toBe("10:00");
    });

    test("09. слот занят CONFIRMED-записью → исключается", async () => {
        db.service.findUnique.mockResolvedValue(ACTIVE_SERVICE);
        db.schedule.findFirst.mockResolvedValue(SCHEDULE_9_12);
        db.appointment.findMany.mockResolvedValue([apptSlot(10, 11)]);
        const slots = await generateSlots("d1", "t1", "s1", TEST_DATE);
        expect(slots).toHaveLength(2);
        expect(slots.every((s) => s.startTime !== "10:00")).toBe(true);
    });

    test("10. все слоты заняты записями → []", async () => {
        db.service.findUnique.mockResolvedValue(ACTIVE_SERVICE);
        db.schedule.findFirst.mockResolvedValue(SCHEDULE_9_12);
        db.appointment.findMany.mockResolvedValue([apptSlot(9, 10), apptSlot(10, 11), apptSlot(11, 12)]);
        expect(await generateSlots("d1", "t1", "s1", TEST_DATE)).toHaveLength(0);
    });

    test("11. запись частично перекрывает два слота → оба исключаются", async () => {
        db.service.findUnique.mockResolvedValue(ACTIVE_SERVICE);
        db.schedule.findFirst.mockResolvedValue(SCHEDULE_9_12);
        // 09:30–10:30 пересекается с [09:00–10:00] и [10:00–11:00]
        db.appointment.findMany.mockResolvedValue([
            { startTime: new Date("2026-01-15T09:30:00.000Z"), endTime: new Date("2026-01-15T10:30:00.000Z") },
        ]);
        const slots = await generateSlots("d1", "t1", "s1", TEST_DATE);
        expect(slots).toHaveLength(1);
        expect(slots[0].startTime).toBe("11:00");
    });

    // ── Фильтрация по блокировкам ───────────────────────────────────────────

    test("12. блокировка покрывает первый слот → исключается", async () => {
        db.service.findUnique.mockResolvedValue(ACTIVE_SERVICE);
        db.schedule.findFirst.mockResolvedValue(SCHEDULE_9_12);
        db.scheduleBlock.findMany.mockResolvedValue([{ startTime: "09:00", endTime: "10:00" }]);
        const slots = await generateSlots("d1", "t1", "s1", TEST_DATE);
        expect(slots).toHaveLength(2);
        expect(slots[0].startTime).toBe("10:00");
    });

    test("13. блокировка покрывает весь рабочий день → []", async () => {
        db.service.findUnique.mockResolvedValue(ACTIVE_SERVICE);
        db.schedule.findFirst.mockResolvedValue(SCHEDULE_9_12);
        db.scheduleBlock.findMany.mockResolvedValue([{ startTime: "09:00", endTime: "12:00" }]);
        expect(await generateSlots("d1", "t1", "s1", TEST_DATE)).toHaveLength(0);
    });

    test("14. блокировка частично перекрывает два слота → оба исключаются", async () => {
        db.service.findUnique.mockResolvedValue(ACTIVE_SERVICE);
        db.schedule.findFirst.mockResolvedValue(SCHEDULE_9_12);
        // 09:30–10:30 → [09:00–10:00] и [10:00–11:00] пересекаются
        db.scheduleBlock.findMany.mockResolvedValue([{ startTime: "09:30", endTime: "10:30" }]);
        const slots = await generateSlots("d1", "t1", "s1", TEST_DATE);
        expect(slots).toHaveLength(1);
        expect(slots[0].startTime).toBe("11:00");
    });

    // ── Комбинированная фильтрация ──────────────────────────────────────────

    test("15. запись и блокировка вместе убирают два разных слота", async () => {
        db.service.findUnique.mockResolvedValue(ACTIVE_SERVICE);
        db.schedule.findFirst.mockResolvedValue(SCHEDULE_9_12);
        db.appointment.findMany.mockResolvedValue([apptSlot(9, 10)]);
        db.scheduleBlock.findMany.mockResolvedValue([{ startTime: "10:00", endTime: "11:00" }]);
        const slots = await generateSlots("d1", "t1", "s1", TEST_DATE);
        expect(slots).toHaveLength(1);
        expect(slots[0].startTime).toBe("11:00");
    });

    // ── 30-минутный буфер ──────────────────────────────────────────────────

    test("16. слоты до буфера (08:30) фильтруются; после — остаются", async () => {
        db.service.findUnique.mockResolvedValue({ id: "s1", duration: 30, isActive: true });
        db.schedule.findFirst.mockResolvedValue({ startTime: "08:00", endTime: "09:00", weekday: 4, isActive: true });
        // 08:00 < 08:30 → убирается; 08:30 >= 08:30 → остаётся
        const slots = await generateSlots("d1", "t1", "s1", TEST_DATE);
        expect(slots).toHaveLength(1);
        expect(slots[0].startTime).toBe("08:30");
    });

    test("17. все слоты внутри 30-мин буфера → []", async () => {
        db.service.findUnique.mockResolvedValue({ id: "s1", duration: 30, isActive: true });
        db.schedule.findFirst.mockResolvedValue({ startTime: "07:00", endTime: "08:00", weekday: 4, isActive: true });
        // 07:00 и 07:30 — оба раньше 08:30
        expect(await generateSlots("d1", "t1", "s1", TEST_DATE)).toHaveLength(0);
    });

    test("18. слот ровно на границе буфера (08:30 >= 08:30) → включается", async () => {
        db.service.findUnique.mockResolvedValue({ id: "s1", duration: 30, isActive: true });
        db.schedule.findFirst.mockResolvedValue({ startTime: "08:30", endTime: "09:00", weekday: 4, isActive: true });
        const slots = await generateSlots("d1", "t1", "s1", TEST_DATE);
        expect(slots).toHaveLength(1);
        expect(slots[0].startTime).toBe("08:30");
    });
});