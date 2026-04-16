import { z } from "zod";

export const bookingSchema = z.object({
    doctorId: z.string().uuid("Неверный ID врача"),
    serviceId: z.string().uuid("Неверный ID услуги"),
    startTime: z.string().datetime("Неверный формат даты"),
    patientName: z.string().min(2, "Укажите ФИО"),
    patientPhone: z.string().min(7, "Укажите номер телефона").optional(),
    patientEmail: z.string().email("Неверный email").optional().or(z.literal("")),
    notes: z.string().max(500).optional(),
});

export const doctorSchema = z.object({
    name: z.string().min(2),
    speciality: z.string().min(2).optional(),
    bio: z.string().max(500).optional(),
    email: z.string().email().optional().or(z.literal("")),
    avatarUrl: z
        .string()
        .optional()
        .refine((v) => !v || v.startsWith("/") || /^https?:\/\//.test(v), "Неверный формат фото"),
});

export const serviceSchema = z.object({
    name: z.string().min(2),
    duration: z.number().int().min(5).max(480),
    price: z.number().int().min(0).optional(),
    description: z.string().max(500).optional(),
});

export const scheduleSchema = z.array(
    z.object({
        weekday: z.number().int().min(0).max(6),
        startTime: z.string().regex(/^\d{2}:\d{2}$/, "Формат HH:MM"),
        endTime: z.string().regex(/^\d{2}:\d{2}$/, "Формат HH:MM"),
        isActive: z.boolean().default(true),
    })
);

export const blockSchema = z.object({
    date: z.string().datetime(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    reason: z.string().max(200).optional(),
});