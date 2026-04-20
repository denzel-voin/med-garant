"use client";

import React, { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { MessageSquare, Loader2 } from "lucide-react";
import { StarRating, RatingBadge } from "./StarRating";

interface Review {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    patientProfile: { fullName: string };
}

interface ReviewsData {
    reviews: Review[];
    averageRating: number | null;
    total: number;
}

interface Props {
    doctorId: string;
    refreshKey?: number;
}

export function ReviewsList({ doctorId, refreshKey = 0 }: Props) {
    const [data, setData] = useState<ReviewsData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/v1/doctors/${doctorId}/reviews`);
            if (res.ok) setData(await res.json());
        } finally {
            setLoading(false);
        }
    }, [doctorId]);

    useEffect(() => { fetchReviews(); }, [fetchReviews, refreshKey]);

    if (loading) {
        return (
            <div className="flex justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
        );
    }

    if (!data || data.total === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="size-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Отзывов пока нет. Будьте первым!</p>
        </div>
    );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 py-2">
    <div className="text-center">
    <p className="text-3xl font-bold">{data.averageRating?.toFixed(1)}</p>
        <p className="text-xs text-muted-foreground">{data.total} отз.</p>
    </div>
    <div className="space-y-1 flex-1">
    <StarRating value={Math.round(data.averageRating ?? 0)} size="md" />
    {[5, 4, 3, 2, 1].map((star) => {
        const count = data.reviews.filter((r) => r.rating === star).length;
        const pct = data.total > 0 ? (count / data.total) * 100 : 0;
        return (
            <div key={star} className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="w-2">{star}</span>
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
            className="h-full rounded-full bg-amber-400"
        style={{ width: `${pct}%` }}
        />
        </div>
        <span className="w-4 text-right">{count}</span>
            </div>
    );
    })}
    </div>
    </div>

    <div className="space-y-3">
        {data.reviews.map((review) => (
                <div key={review.id} className="rounded-2xl border border-border p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
            <div>
                <p className="font-medium text-sm">
                {anonymizeName(review.patientProfile.fullName)}
    </p>
    <p className="text-xs text-muted-foreground">
        {format(new Date(review.createdAt), "d MMMM yyyy", { locale: ru })}
    </p>
    </div>
    <StarRating value={review.rating} size="sm" />
        </div>
    {review.comment && (
        <p className="text-sm text-foreground/90 leading-relaxed">
            {review.comment}
            </p>
    )}
    </div>
))}
    </div>
    </div>
);
}

function anonymizeName(fullName: string): string {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts.slice(1).map((p) => p[0] + ".").join(" ")}`;
}