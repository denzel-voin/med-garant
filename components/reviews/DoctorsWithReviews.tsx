"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Star, Stethoscope } from "lucide-react";
import { RatingBadge } from "./StarRating";
import { ReviewsList } from "./ReviewsList";
import { ReviewForm } from "./ReviewForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Doctor {
    id: string;
    name: string;
    speciality?: string | null;
    avatarUrl?: string | null;
    averageRating: number | null;
    reviewCount: number;
}

interface Props {
    doctors: Doctor[];
    isPatient?: boolean;
}

export function DoctorsWithReviews({ doctors, isPatient = false }: Props) {
    const [openDoctor, setOpenDoctor] = useState<string | null>(null);
    const [reviewTarget, setReviewTarget] = useState<{ doctorId: string; doctorName: string } | null>(null);
    const [showAuthPrompt, setShowAuthPrompt] = useState(false);
    const [refreshKeys, setRefreshKeys] = useState<Record<string, number>>({});

    function toggleDoctor(id: string) {
        setOpenDoctor((prev) => (prev === id ? null : id));
    }

    function handleReviewSuccess(doctorId: string) {
        setReviewTarget(null);
        setRefreshKeys((prev) => ({ ...prev, [doctorId]: (prev[doctorId] ?? 0) + 1 }));
    }

    return (
        <>
            <div className="space-y-3">
                {doctors.map((doctor) => {
                    const isOpen = openDoctor === doctor.id;
                    return (
                        <div key={doctor.id} className="rounded-2xl border border-border overflow-hidden">
                            <button
                                className="w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/40 transition-colors text-left"
                                onClick={() => toggleDoctor(doctor.id)}
                            >
                                <div className="size-10 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                                    {doctor.avatarUrl ? (
                                        <img src={doctor.avatarUrl} alt={doctor.name} className="size-full object-cover" />
                                    ) : (
                                        <Stethoscope className="size-5 text-muted-foreground" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{doctor.name}</p>
                                    {doctor.speciality && (
                                        <p className="text-sm text-muted-foreground truncate">{doctor.speciality}</p>
                                    )}
                                    <div className="mt-0.5">
                                        {doctor.reviewCount > 0 ? (
                                            <RatingBadge
                                                average={doctor.averageRating}
                                                total={doctor.reviewCount}
                                            />
                                        ) : (
                                            <span className="text-xs text-muted-foreground">Нет отзывов</span>
                                        )}
                                    </div>
                                </div>

                                {isOpen ? (
                                    <ChevronUp className="size-4 text-muted-foreground shrink-0" />
                                ) : (
                                    <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                                )}
                            </button>

                            {isOpen && (
                                <div className="border-t border-border px-4 py-4 space-y-4">
                                    <ReviewsList
                                        doctorId={doctor.id}
                                        refreshKey={refreshKeys[doctor.id] ?? 0}
                                    />

                                    <div className="pt-2 border-t border-border">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="gap-1.5"
                                            onClick={() => {
                                                if (isPatient) {
                                                    setReviewTarget({ doctorId: doctor.id, doctorName: doctor.name });
                                                } else {
                                                    setShowAuthPrompt(true);
                                                }
                                            }}
                                        >
                                            <Star className="size-3.5" />
                                            Оставить отзыв
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {reviewTarget && (
                <ReviewForm
                    doctorId={reviewTarget.doctorId}
                    doctorName={reviewTarget.doctorName}
                    onCancel={() => setReviewTarget(null)}
                    onSuccess={() => handleReviewSuccess(reviewTarget.doctorId)}
                />
            )}

            {showAuthPrompt && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40"
                    onClick={() => setShowAuthPrompt(false)}
                >
                    <div
                        className="bg-card rounded-2xl border border-border w-full max-w-sm p-6 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-semibold text-lg">Войдите, чтобы оставить отзыв</h3>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    Отзывы могут оставлять только зарегистрированные пациенты
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAuthPrompt(false)}
                                className="text-muted-foreground hover:text-foreground text-xl leading-none ml-3 shrink-0"
                            >
                                ×
                            </button>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Link
                                href="/login-patient"
                                className="inline-flex items-center justify-center h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                            >
                                Войти
                            </Link>
                            <Link
                                href="/register-patient"
                                className="inline-flex items-center justify-center h-10 px-4 rounded-xl border border-border text-sm font-medium hover:bg-muted/50 transition-colors"
                            >
                                Зарегистрироваться
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}