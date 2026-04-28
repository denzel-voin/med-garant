import { registerSchema, loginSchema } from "@/lib/validators";

// ── registerSchema (4 тест-кейса) ─────────────────────────────────────────

describe("registerSchema", () => {
    const valid = {
        clinicName: "Моя Клиника",
        slug: "my-clinic-01",
        email: "admin@clinic.ru",
        password: "securepassword",
    };

    test("01. корректные данные регистрации клиники проходят", () => {
        expect(() => registerSchema.parse(valid)).not.toThrow();
    });

    test("02. clinicName короче 2 символов → ошибка", () => {
        expect(() => registerSchema.parse({ ...valid, clinicName: "А" })).toThrow();
    });

    test("03. slug с заглавными буквами → ошибка", () => {
        expect(() => registerSchema.parse({ ...valid, slug: "My-Clinic" })).toThrow();
    });

    test("04. password короче 8 символов → ошибка", () => {
        expect(() => registerSchema.parse({ ...valid, password: "short" })).toThrow();
    });
});

// ── loginSchema (4 тест-кейса) ────────────────────────────────────────────

describe("loginSchema", () => {
    const valid = { email: "user@mail.ru", password: "password123" };

    test("05. корректные данные входа проходят", () => {
        expect(() => loginSchema.parse(valid)).not.toThrow();
    });

    test("06. некорректный email при входе → ошибка", () => {
        expect(() => loginSchema.parse({ ...valid, email: "not-an-email" })).toThrow();
    });

    test("07. пустой пароль → ошибка (min: 1)", () => {
        expect(() => loginSchema.parse({ ...valid, password: "" })).toThrow();
    });

    test("08. отсутствующее поле email → ошибка", () => {
        expect(() => loginSchema.parse({ password: "password123" })).toThrow();
    });
});
