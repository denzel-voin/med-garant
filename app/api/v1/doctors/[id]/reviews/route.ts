import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getTenantContext } from "@/lib/api-helpers";

const reviewSchema = z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(1000).optional(),
    appointmentId: z.string().uuid().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;

        const reviews = await prisma.doctorReview.findMany({
            where: { doctorId: id },
            orderBy: { createdAt: "desc" },
            include: {
                patientProfile: { select: { fullName: true } },
            },
        });

        const avg =
            reviews.length > 0
                ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
                : null;

        return NextResponse.json({ reviews, averageRating: avg, total: reviews.length });
    } catch (e) {
        console.error("[reviews GET]", e);
        return NextResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: Params) {
    try {
        const ctx = getTenantContext(req);
        if (ctx.role !== "PATIENT") {
            return NextResponse.json(
                { error: { code: "FORBIDDEN", message: "Только авторизованные пациенты могут оставлять отзывы" } },
                { status: 403 }
            );
        }

        const { id: doctorId } = await params;

        const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
        if (!doctor) {
            return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
        }

        const profile = await prisma.patientProfile.findUnique({ where: { userId: ctx.userId } });
        if (!profile) {
            return NextResponse.json({ error: { code: "PROFILE_NOT_FOUND" } }, { status: 404 });
        }

        const body = await req.json();
        const data = reviewSchema.parse(body);

        if (data.appointmentId) {
            const apt = await prisma.appointment.findFirst({
                where: {
                    id: data.appointmentId,
                    doctorId,
                    patientUserId: ctx.userId,
                    status: "COMPLETED",
                },
            });
            if (!apt) {
                return NextResponse.json(
                    {
                        error: {
                            code: "APPOINTMENT_INVALID",
                            message: "Запись не найдена, не завершена или вам не принадлежит",
                        },
                    },
                    { status: 400 }
                );
            }

            const exists = await prisma.doctorReview.findUnique({
                where: { appointmentId: data.appointmentId },
            });
            if (exists) {
                return NextResponse.json(
                    { error: { code: "ALREADY_REVIEWED", message: "Вы уже оставили отзыв на этот визит" } },
                    { status: 409 }
                );
            }
        }

        const review = await prisma.doctorReview.create({
            data: {
                rating: data.rating,
                comment: data.comment ?? null,
                doctorId,
                patientProfileId: profile.id,
                appointmentId: data.appointmentId ?? null,
            },
            include: {
                patientProfile: { select: { fullName: true } },
            },
        });

        return NextResponse.json(review, { status: 201 });
    } catch (e) {
        if (e instanceof z.ZodError) {
            return NextResponse.json({ error: { code: "VALIDATION_ERROR", details: e.issues } }, { status: 400 });
        }
        const msg = e instanceof Error ? e.message : "";
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
        console.error("[reviews POST]", e);
        return NextResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 });
    }
}