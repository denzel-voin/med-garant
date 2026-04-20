"use client";

import React, { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Loader2, Calendar, Star, ExternalLink, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { StarRating } from "@/components/reviews/StarRating";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import Link from "next/link";

interface ReviewSnap {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
}

interface Appointment {
    id: string;
    startTime: string;
    endTime: string;
    status: string;
    patientName: string;
    notes: string | null;
    doctor: { id: string; name: string; speciality: string | null; avatarUrl: string | null };
    service: { name: string; duration: number; price: number | null };
    tenant: { name: string; slug: string; address: string | null; logo: string | null };
    review: ReviewSnap | null;
}

export default function PatientMePage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [unauthorized, setUnauthorized] = useState(false);
    const [reviewTarget, setReviewTarget] = useState<{
        doctorId: string;
        doctorName: string;
        appointmentId: string;
    } | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchAppointments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/v1/patient/appointments");
            if (res.status === 401 || res.status === 403) {
                setUnauthorized(true);
                return;
            }
            if (res.ok) {
                setAppointments(await res.json());
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAppointments(); }, [fetchAppointments, refreshKey]);

    const now = new Date();
    const upcoming = appointments.filter((a) => new Date(a.startTime) >= now);
    const past = appointments.filter((a) => new Date(a.startTime) < now);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (unauthorized) {
        return (
            <div className="text-center py-20 space-y-4">
                <LogIn className="size-12 mx-auto text-muted-foreground opacity-40" />
                <h2 className="text-xl font-semibold">Необходима авторизация</h2>
                <p className="text-muted-foreground text-sm">
                    Войдите в аккаунт пациента, чтобы видеть свои записи
                </p>
                <div className="flex justify-center gap-3">
                    <Button asChild variant="outline">
                        <Link href="/login-patient">Войти</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/register-patient">Зарегистрироваться</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-semibold">Мои записи</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    История визитов и возможность оставить отзыв
                </p>
            </div>

            {appointments.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                    <Calendar className="size-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Нет записей</p>
                    <p className="text-sm mt-1">Ваши будущие и прошедшие визиты появятся здесь</p>
                </div>
            ) : (
                <>
                    {upcoming.length > 0 && (
                        <section className="space-y-3">
                            <h2 className="font-semibold text-base flex items-center gap-2">
                                <span className="size-2 rounded-full bg-emerald-500 inline-block" />
                                Предстоящие визиты
                            </h2>
                            {upcoming.map((apt) => (
                                <AppointmentCard
                                    key={apt.id}
                                    apt={apt}
                                    onReview={() =>
                                        setReviewTarget({
                                            doctorId: apt.doctor.id,
                                            doctorName: apt.doctor.name,
                                            appointmentId: apt.id,
                                        })
                                    }
                                />
                            ))}
                        </section>
                    )}

                    {past.length > 0 && (
                        <section className="space-y-3">
                            <h2 className="font-semibold text-base flex items-center gap-2">
                                <span className="size-2 rounded-full bg-muted-foreground inline-block" />
                                Прошедшие визиты
                            </h2>
                            {past.map((apt) => (
                                <AppointmentCard
                                    key={apt.id}
                                    apt={apt}
                                    onReview={() =>
                                        setReviewTarget({
                                            doctorId: apt.doctor.id,
                                            doctorName: apt.doctor.name,
                                            appointmentId: apt.id,
                                        })
                                    }
                                />
                            ))}
                        </section>
                    )}
                </>
            )}

            {reviewTarget && (
                <ReviewForm
                    doctorId={reviewTarget.doctorId}
                    doctorName={reviewTarget.doctorName}
                    appointmentId={reviewTarget.appointmentId}
                    onCancel={() => setReviewTarget(null)}
                    onSuccess={() => {
                        setReviewTarget(null);
                        setRefreshKey((k) => k + 1);
                    }}
                />
            )}
        </div>
    );
}

function AppointmentCard({
                             apt,
                             onReview,
                         }: {
    apt: Appointment;
    onReview: () => void;
}) {
    const canReview = apt.status === "COMPLETED" && !apt.review;

    return (
        <Card>
            <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                        {apt.tenant.logo ? (
                            <img
                                src={apt.tenant.logo}
                                alt={apt.tenant.name}
                                className="size-8 rounded-lg object-cover shrink-0"
                            />
                        ) : (
                            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm shrink-0">
                                🏥
                            </div>
                        )}
                        <div>
                            <p className="font-medium text-sm">{apt.tenant.name}</p>
                            {apt.tenant.address && (
                                <p className="text-xs text-muted-foreground">{apt.tenant.address}</p>
                            )}
                        </div>
                    </div>
                    <StatusBadge status={apt.status} />
                </div>

                <div className="flex items-center gap-2">
                    {apt.doctor.avatarUrl ? (
                        <img
                            src={apt.doctor.avatarUrl}
                            alt={apt.doctor.name}
                            className="size-9 rounded-xl object-cover shrink-0"
                        />
                    ) : (
                        <div className="size-9 rounded-xl bg-muted flex items-center justify-center text-base shrink-0">
                            👤
                        </div>
                    )}
                    <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{apt.doctor.name}</p>
                        {apt.doctor.speciality && (
                            <p className="text-xs text-muted-foreground truncate">{apt.doctor.speciality}</p>
                        )}
                    </div>
                    <div className="ml-auto text-right text-sm shrink-0">
                        <p className="font-medium">
                            {format(new Date(apt.startTime), "d MMM yyyy", { locale: ru })}
                        </p>
                        <p className="text-muted-foreground text-xs">
                            {format(new Date(apt.startTime), "HH:mm")}
                        </p>
                    </div>
                </div>

                <p className="text-sm text-muted-foreground">
                    {apt.service.name} · {apt.service.duration} мин
                    {apt.service.price != null && ` · ${apt.service.price.toLocaleString("ru-RU")} ₽`}
                </p>

                {apt.review && (
                    <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 px-3 py-2 text-sm">
                        <StarRating value={apt.review.rating} size="sm" />
                        {apt.review.comment && (
                            <p className="text-muted-foreground line-clamp-2 flex-1">{apt.review.comment}</p>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                    <Link
                        href={`/${apt.tenant.slug}`}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ExternalLink className="size-3" />
                        Страница клиники
                    </Link>

                    {canReview && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="ml-auto gap-1.5"
                            onClick={onReview}
                        >
                            <Star className="size-3.5" />
                            Оставить отзыв
                        </Button>
                    )}

                    {apt.review && (
                        <p className="ml-auto text-xs text-muted-foreground">Отзыв оставлен</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}