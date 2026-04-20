"use client";

import React, { useState } from "react";
import { StarRating } from "./StarRating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

interface Props {
    doctorId: string;
    doctorName: string;
    appointmentId?: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function ReviewForm({ doctorId, doctorName, appointmentId, onSuccess, onCancel }: Props) {
    const { toast } = useToast();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (rating === 0) {
            toast("Пожалуйста, поставьте оценку", "error");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`/api/v1/doctors/${doctorId}/reviews`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    rating,
                    comment: comment.trim() || undefined,
                    appointmentId,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                const msg =
                    data.error?.code === "ALREADY_REVIEWED"
                        ? "Вы уже оставили отзыв на этот визит"
                        : data.error?.code === "FORBIDDEN"
                            ? "Войдите как пациент, чтобы оставить отзыв"
                            : data.error?.message ?? "Ошибка отправки";
                toast(msg, "error");
                return;
            }
            toast("Отзыв опубликован. Спасибо!", "success");
            onSuccess();
        } catch {
            toast("Ошибка сети", "error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40"
            onClick={onCancel}
        >
            <div
                className="bg-card rounded-2xl border border-border w-full max-w-md p-6 space-y-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-semibold text-lg">Оставить отзыв</h3>
                        <p className="text-sm text-muted-foreground">{doctorName}</p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-muted-foreground hover:text-foreground text-xl leading-none"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <p className="text-sm font-medium">Оценка *</p>
                        <StarRating value={rating} onChange={setRating} size="lg" />
                        <p className="text-xs text-muted-foreground">
                            {["", "Ужасно", "Плохо", "Нормально", "Хорошо", "Отлично"][rating] || "Выберите оценку"}
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <p className="text-sm font-medium">
                            Комментарий{" "}
                            <span className="text-muted-foreground font-normal">(необязательно)</span>
                        </p>
                        <Textarea
                            placeholder="Расскажите о своём опыте: профессионализм врача, атмосфера, результат..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            maxLength={1000}
                            rows={4}
                        />
                        <p className="text-xs text-muted-foreground text-right">{comment.length}/1000</p>
                    </div>

                    <p className="text-xs text-muted-foreground bg-muted/50 rounded-xl px-3 py-2">
                        ℹ️ Отзыв будет виден всем посетителям страницы клиники
                    </p>

                    <div className="flex gap-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
                            Отмена
                        </Button>
                        <Button type="submit" className="flex-1" disabled={loading || rating === 0}>
                            {loading ? "Отправляем..." : "Опубликовать"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}