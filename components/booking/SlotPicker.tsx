"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
    format,
    addDays,
    isSameDay,
    startOfToday,
    isToday,
} from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Slot {
    startTime: string;
    endTime: string;
}

interface Props {
    slug: string;
    doctorId: string;
    serviceId: string;
    onSelect: (slot: Slot, date: Date) => void;
    selectedSlot?: Slot | null;
}

const DAYS_VISIBLE = 7;
const DAYS_AHEAD = 30;

export function SlotPicker({ slug, doctorId, serviceId, onSelect, selectedSlot }: Props) {
    const today = startOfToday();
    const [weekStart, setWeekStart] = useState(0); // offset in days from today
    const [selectedDate, setSelectedDate] = useState<Date>(today);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchSlots = useCallback(
        async (date: Date) => {
            if (!doctorId || !serviceId) return;
            setLoading(true);
            setSlots([]);
            try {
                const dateStr = format(date, "yyyy-MM-dd") + "T00:00:00.000Z";
                const res = await fetch(
                    `/api/v1/tenants/${slug}/specialists/${doctorId}/slots?date=${encodeURIComponent(dateStr)}&serviceId=${serviceId}`
                );
                if (res.ok) {
                    const data = await res.json();
                    setSlots(data.slots ?? []);
                }
            } catch {
                setSlots([]);
            } finally {
                setLoading(false);
            }
        },
        [slug, doctorId, serviceId]
    );

    useEffect(() => {
        fetchSlots(selectedDate);
    }, [selectedDate, fetchSlots]);

    // Build date strip
    const dates = Array.from({ length: DAYS_VISIBLE }, (_, i) =>
        addDays(today, weekStart + i)
    );

    const canGoPrev = weekStart > 0;
    const canGoNext = weekStart + DAYS_VISIBLE < DAYS_AHEAD;

    return (
        <div className="space-y-4">
            {/* Date strip */}
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    disabled={!canGoPrev}
                    onClick={() => setWeekStart((w) => Math.max(0, w - DAYS_VISIBLE))}
                    className="shrink-0"
                >
                    <ChevronLeft className="size-4" />
                </Button>

                <div className="flex flex-1 gap-1 overflow-hidden">
                    {dates.map((date) => {
                        const active = isSameDay(date, selectedDate);
                        const todayMark = isToday(date);
                        return (
                            <button
                                key={date.toISOString()}
                                onClick={() => {
                                    setSelectedDate(date);
                                    onSelect(null as unknown as Slot, date); // clear slot on date change
                                }}
                                className={cn(
                                    "flex flex-col items-center flex-1 py-2 rounded-xl text-xs transition-all",
                                    "border",
                                    active
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "border-border hover:bg-muted",
                                    todayMark && !active && "border-primary/40"
                                )}
                            >
                <span className="font-medium uppercase">
                  {format(date, "EEE", { locale: ru })}
                </span>
                                <span className={cn("text-base font-semibold mt-0.5", active ? "" : "text-foreground")}>
                  {format(date, "d")}
                </span>
                                {todayMark && (
                                    <span className={cn("text-[9px] mt-0.5", active ? "opacity-80" : "text-primary")}>
                    сегодня
                  </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    disabled={!canGoNext}
                    onClick={() => setWeekStart((w) => w + DAYS_VISIBLE)}
                    className="shrink-0"
                >
                    <ChevronRight className="size-4" />
                </Button>
            </div>

            {/* Slot grid */}
            <div className="min-h-[100px]">
                {loading ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        <span className="text-sm">Загружаем доступное время...</span>
                    </div>
                ) : slots.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        На этот день нет свободных слотов
                    </p>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {slots.map((slot) => {
                            const isSelected =
                                selectedSlot?.startTime === slot.startTime &&
                                selectedSlot?.endTime === slot.endTime;
                            return (
                                <button
                                    key={slot.startTime}
                                    onClick={() => onSelect(slot, selectedDate)}
                                    className={cn(
                                        "py-2 px-3 rounded-xl text-sm font-medium border transition-all",
                                        isSelected
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "border-border hover:bg-muted hover:border-primary/30"
                                    )}
                                >
                                    {slot.startTime}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}