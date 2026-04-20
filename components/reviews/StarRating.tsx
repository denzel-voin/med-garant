"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    value: number;
    onChange?: (v: number) => void;
    size?: "sm" | "md" | "lg";
}

const SIZE = { sm: "size-4", md: "size-5", lg: "size-6" };

export function StarRating({ value, onChange, size = "md" }: Props) {
    const [hovered, setHovered] = useState(0);
    const readOnly = !onChange;
    const display = hovered || value;

    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={readOnly}
                    onClick={() => onChange?.(star)}
                    onMouseEnter={() => !readOnly && setHovered(star)}
                    onMouseLeave={() => !readOnly && setHovered(0)}
                    className={cn(
                        "transition-colors",
                        readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"
                    )}
                    aria-label={`${star} звезд`}
                >
                    <Star
                        className={cn(
                            SIZE[size],
                            "transition-all",
                            star <= display
                                ? "fill-amber-400 text-amber-400"
                                : "fill-none text-muted-foreground/40"
                        )}
                    />
                </button>
            ))}
        </div>
    );
}

export function RatingBadge({
                                average,
                                total,
                            }: {
    average: number | null;
    total: number;
}) {
    if (!average || total === 0) return null;
    return (
        <span className="inline-flex items-center gap-1 text-sm text-amber-600">
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            <span className="font-semibold">{average.toFixed(1)}</span>
            <span className="text-muted-foreground">({total})</span>
        </span>
    );
}