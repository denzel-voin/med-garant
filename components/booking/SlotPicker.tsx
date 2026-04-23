"use client";

import React, { useEffect, useState, useCallback } from "react";
import { format, addDays, isSameDay, startOfToday, isToday } from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Slot { startTime: string; endTime: string; }

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
    const [weekStart, setWeekStart] = useState(0);
    const [selectedDate, setSelectedDate] = useState<Date>(today);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchSlots = useCallback(async (date: Date) => {
        if (!doctorId || !serviceId) return;
        setLoading(true);
        setSlots([]);
        try {
            const dateStr = format(date, "yyyy-MM-dd") + "T00:00:00.000Z";
            const res = await fetch(`/api/v1/tenants/${slug}/specialists/${doctorId}/slots?date=${encodeURIComponent(dateStr)}&serviceId=${serviceId}`);
            if (res.ok) setSlots((await res.json()).slots ?? []);
        } catch {
            setSlots([]);
        } finally {
            setLoading(false);
        }
    }, [slug, doctorId, serviceId]);

    useEffect(() => { fetchSlots(selectedDate); }, [selectedDate, fetchSlots]);

    const dates = Array.from({ length: DAYS_VISIBLE }, (_, i) => addDays(today, weekStart + i));
    const canGoPrev = weekStart > 0;
    const canGoNext = weekStart + DAYS_VISIBLE < DAYS_AHEAD;

    return (
        <div className="space-y-4">
            {/* Date strip */}
            <div className="flex items-center gap-1">
                <button
                    disabled={!canGoPrev}
                    onClick={() => setWeekStart((w) => Math.max(0, w - DAYS_VISIBLE))}
                    className="size-8 flex items-center justify-center rounded-xl hover:bg-[#F5F5F7] disabled:opacity-30 transition-colors shrink-0"
                >
                    <ChevronLeft className="size-4 text-[#1D1D1F]" />
                </button>

                <div className="flex flex-1 gap-1 overflow-hidden">
                    {dates.map((date) => {
                        const active = isSameDay(date, selectedDate);
                        const todayMark = isToday(date);
                        return (
                            <button
                                key={date.toISOString()}
                                onClick={() => { setSelectedDate(date); onSelect(null as unknown as Slot, date); }}
                                className={cn(
                                    "flex flex-col items-center flex-1 py-2 rounded-xl text-xs transition-all",
                                    active
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : cn("bg-[#F5F5F7] hover:bg-[#EBEBEB]", todayMark && "ring-2 ring-primary/30")
                                )}
                            >
                                <span className={cn("font-medium uppercase", active ? "opacity-80" : "text-[#6E6E73]")}>
                                    {format(date, "EEE", { locale: ru })}
                                </span>
                                <span className={cn("text-base font-bold mt-0.5", active ? "" : "text-[#1D1D1F]")}>
                                    {format(date, "d")}
                                </span>
                                {todayMark && (
                                    <span className={cn("text-[9px] mt-0.5 font-medium", active ? "opacity-70" : "text-primary")}>
                                        сег
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <button
                    disabled={!canGoNext}
                    onClick={() => setWeekStart((w) => w + DAYS_VISIBLE)}
                    className="size-8 flex items-center justify-center rounded-xl hover:bg-[#F5F5F7] disabled:opacity-30 transition-colors shrink-0"
                >
                    <ChevronRight className="size-4 text-[#1D1D1F]" />
                </button>
            </div>

            {/* Slots */}
            <div className="min-h-[100px]">
                {loading ? (
                    <div className="flex items-center justify-center py-8 text-[#6E6E73] gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        <span className="text-sm">Загружаем время...</span>
                    </div>
                ) : slots.length === 0 ? (
                    <p className="text-sm text-[#6E6E73] text-center py-8">На этот день нет свободных слотов</p>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {slots.map((slot) => {
                            const isSelected = selectedSlot?.startTime === slot.startTime;
                            return (
                                <button
                                    key={slot.startTime}
                                    onClick={() => onSelect(slot, selectedDate)}
                                    className={cn(
                                        "py-2.5 px-3 rounded-xl text-sm font-medium transition-all",
                                        isSelected
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#EBEBEB]"
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
