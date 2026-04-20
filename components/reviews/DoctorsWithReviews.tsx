"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Star, Stethoscope, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { RatingBadge, StarRating } from "./StarRating";
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
}

export function DoctorsWithReviews({ doctors }: Props) {
    const [openDoctor, setOpenDoctor] = useState<string | null>(null);
    const [reviewTarget, setReviewTarget] = useState<{ doctorId: string; doctorName: string } | null>(null);
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

                                    <div className="pt-2 border-t border-border flex items-center gap-3">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="gap-1.5"
                                            onClick={() =>
                                                setReviewTarget({
                                                    doctorId: doctor.id,
                                                    doctorName: doctor.name,
                                                })
                                            }
                                        >
                                            <Star className="size-3.5" />
                                            Оставить отзыв
                                        </Button>
                                        <Link
                                            href="/login-patient"
                                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <UserCheck className="size-3.5" />
                                            Войти как пациент
                                        </Link>
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
        </>
    );
}