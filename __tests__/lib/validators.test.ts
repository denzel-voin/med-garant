import {
    bookingSchema,
    doctorSchema,
    serviceSchema,
    scheduleSchema,
    blockSchema,
} from "@/lib/validators";

// ── bookingSchema (6 тест-кейсов) ─────────────────────────────────────────

describe("bookingSchema", () => {
    const valid = {
        doctorId: "550e8400-e29b-41d4-a716-446655440000",
        serviceId: "550e8400-e29b-41d4-a716-446655440001",
        startTime: "2026-01-15T10:00:00.000Z",
        patientName: "Иванов Иван Иванович",
    };

    test("01. корректная полная запись проходит валидацию", () => {
        expect(() =>
            bookingSchema.parse({ ...valid, patientEmail: "ivan@mail.ru", notes: "Примечание" })
        ).not.toThrow();
    });

    test("02. некорректный UUID doctorId → ошибка", () => {
        expect(() => bookingSchema.parse({ ...valid, doctorId: "not-a-uuid" })).toThrow();
    });

    test("03. patientName короче 2 символов → ошибка", () => {
        expect(() => bookingSchema.parse({ ...valid, patientName: "А" })).toThrow();
    });

    test("04. некорректный формат email → ошибка", () => {
        expect(() => bookingSchema.parse({ ...valid, patientEmail: "not-an-email" })).toThrow();
    });

    test("05. notes длиннее 500 символов → ошибка", () => {
        expect(() => bookingSchema.parse({ ...valid, notes: "x".repeat(501) })).toThrow();
    });

    test("06. минимальная корректная запись (только обязательные поля) проходит", () => {
        const result = bookingSchema.parse(valid);
        expect(result.patientName).toBe("Иванов Иван Иванович");
        expect(result.notes).toBeUndefined();
    });
});

// ── doctorSchema (5 тест-кейсов) ──────────────────────────────────────────

describe("doctorSchema", () => {
    const valid = { name: "Петров Пётр Петрович" };

    test("07. корректные данные врача проходят валидацию", () => {
        expect(() =>
            doctorSchema.parse({
                ...valid,
                speciality: "Терапевт",
                bio: "Опыт 10 лет",
                email: "doctor@clinic.ru",
                avatarUrl: "/uploads/photo.jpg",
            })
        ).not.toThrow();
    });

    test("08. name короче 2 символов → ошибка", () => {
        expect(() => doctorSchema.parse({ name: "А" })).toThrow();
    });

    test("09. некорректный email → ошибка", () => {
        expect(() => doctorSchema.parse({ ...valid, email: "not-email" })).toThrow();
    });

    test("10. avatarUrl не начинается с / или http → ошибка", () => {
        expect(() => doctorSchema.parse({ ...valid, avatarUrl: "ftp://example.com/photo.jpg" })).toThrow();
    });

    test("11. пустая строка в email разрешена", () => {
        expect(() => doctorSchema.parse({ ...valid, email: "" })).not.toThrow();
    });
});

// ── serviceSchema (5 тест-кейсов) ─────────────────────────────────────────

describe("serviceSchema", () => {
    const valid = { name: "Консультация терапевта", duration: 60 };

    test("12. корректная услуга проходит валидацию", () => {
        const result = serviceSchema.parse(valid);
        expect(result.duration).toBe(60);
    });

    test("13. duration < 5 минут → ошибка", () => {
        expect(() => serviceSchema.parse({ ...valid, duration: 4 })).toThrow();
    });

    test("14. duration > 480 минут → ошибка", () => {
        expect(() => serviceSchema.parse({ ...valid, duration: 481 })).toThrow();
    });

    test("15. отрицательная цена → ошибка", () => {
        expect(() => serviceSchema.parse({ ...valid, price: -1 })).toThrow();
    });

    test("16. name короче 2 символов → ошибка", () => {
        expect(() => serviceSchema.parse({ name: "А", duration: 30 })).toThrow();
    });
});

// ── scheduleSchema (4 тест-кейса) ─────────────────────────────────────────

describe("scheduleSchema", () => {
    const validEntry = { weekday: 1, startTime: "09:00", endTime: "18:00" };

    test("17. корректный массив расписания проходит валидацию", () => {
        const result = scheduleSchema.parse([validEntry]);
        // isActive по умолчанию true
        expect(result[0].isActive).toBe(true);
    });

    test("18. weekday > 6 → ошибка", () => {
        expect(() => scheduleSchema.parse([{ ...validEntry, weekday: 7 }])).toThrow();
    });

    test("19. startTime в неверном формате (однозначный час) → ошибка", () => {
        expect(() => scheduleSchema.parse([{ ...validEntry, startTime: "9:00" }])).toThrow();
    });

    test("20. пустой массив расписания допустим", () => {
        expect(() => scheduleSchema.parse([])).not.toThrow();
    });
});

// ── blockSchema (4 тест-кейса) ────────────────────────────────────────────

describe("blockSchema", () => {
    const valid = {
        date: "2026-01-15T00:00:00.000Z",
        startTime: "10:00",
        endTime: "11:00",
    };

    test("21. корректный блок проходит валидацию", () => {
        expect(() => blockSchema.parse(valid)).not.toThrow();
    });

    test("22. startTime в неверном формате → ошибка", () => {
        expect(() => blockSchema.parse({ ...valid, startTime: "10:0" })).toThrow();
    });

    test("23. endTime в неверном формате → ошибка", () => {
        expect(() => blockSchema.parse({ ...valid, endTime: "1100" })).toThrow();
    });

    test("24. reason длиннее 200 символов → ошибка", () => {
        expect(() => blockSchema.parse({ ...valid, reason: "x".repeat(201) })).toThrow();
    });
});
