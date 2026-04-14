"use client";

import React, { useEffect, useState, useCallback } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from "date-fns";
import { ru } from "date-fns/locale";
import { Loader2, Plus, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { useToast } from "@/components/ui/toast";

interface Appointment {
    id: string;
    startTime: string;
    endTime: string;
    status: string;
    patientName: string;
    patientPhone?: string | null;
    patientEmail?: string | null;
    notes?: string | null;
    doctor: { id: string; name: string; speciality?: string | null };
    service: { id: string; name: string; duration: number };
}

const VIEWS = ["day", "week", "month"] as const;
type View = (typeof VIEWS)[number];

const ACTIONS = [
    { status: "CONFIRMED", label: "Подтвердить", color: "bg-emerald-600" },
    { status: "COMPLETED", label: "Завершить", color: "bg-blue-600" },
    { status: "NO_SHOW", label: "Не явился", color: "bg-amber-500" },
    { status: "CANCELLED_BY_CLINIC", label: "Отменить", color: "bg-red-500" },
];

export default function AppointmentsPage() {
    const { toast } = useToast();
    const [view, setView] = useState<View>("week");
    const [pivot, setPivot] = useState(new Date());
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Appointment | null>(null);
    const [statusLoading, setStatusLoading] = useState(false);

    const { from, to } = (() => {
        if (view === "day") return { from: pivot, to: pivot };
        if (view === "week") return { from: startOfWeek(pivot, { weekStartsOn: 1 }), to: endOfWeek(pivot, { weekStartsOn: 1 }) };
        return { from: startOfMonth(pivot), to: endOfMonth(pivot) };
    })();

    const fetchAppointments = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                from: from.toISOString(),
                to: to.toISOString(),
            });
            const res = await fetch(`/api/v1/appointments?${params}`);
            if (res.ok) setAppointments(await res.json());
        } finally {
            setLoading(false);
        }
    }, [from.toISOString(), to.toISOString()]);

    useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

    async function changeStatus(id: string, status: string) {
        setStatusLoading(true);
        try {
            const res = await fetch(`/api/v1/appointments/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (res.ok) {
                toast("Статус обновлён", "success");
                fetchAppointments();
                setSelected(null);
            } else {
                toast("Не удалось обновить статус", "error");
            }
        } finally {
            setStatusLoading(false);
        }
    }

    function navigate(dir: 1 | -1) {
        setPivot((p) => {
            if (view === "day") return addDays(p, dir);
            if (view === "week") return addDays(p, dir * 7);
            const d = new Date(p);
            d.setMonth(d.getMonth() + dir);
            return d;
        });
    }

    const periodLabel = view === "day"
        ? format(pivot, "d MMMM yyyy", { locale: ru })
        : view === "week"
            ? `${format(from, "d MMM", { locale: ru })} — ${format(to, "d MMM yyyy", { locale: ru })}`
            : format(pivot, "LLLL yyyy", { locale: ru });

    return (
        <div className="space-y-4 max-w-5xl">
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex rounded-xl border border-border overflow-hidden">
                    {VIEWS.map((v) => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className={`px-3 py-1.5 text-sm font-medium transition-all ${
                                view === v ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                            }`}
                        >
                            {{ day: "День", week: "Неделя", month: "Месяц" }[v]}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ChevronLeft className="size-4" />
                    </Button>
                    <span className="text-sm font-medium min-w-[160px] text-center">{periodLabel}</span>
                    <Button variant="ghost" size="icon" onClick={() => navigate(1)}>
                        <ChevronRight className="size-4" />
                    </Button>
                </div>

                <div className="ml-auto">
                    <Button size="sm" onClick={() => setPivot(new Date())} variant="outline">
                        Сегодня
                    </Button>
                </div>
            </div>

            {/* Appointment list */}
            {loading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                    <Loader2 className="size-5 animate-spin" />
                    <span>Загружаем записи...</span>
                </div>
            ) : appointments.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                    <p className="font-medium">Записей нет</p>
                    <p className="text-sm mt-1">В этом периоде нет ни одной записи</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {appointments.map((apt) => (
                        <Card
                            key={apt.id}
                            className="cursor-pointer hover:border-primary/30 transition-all"
                            onClick={() => setSelected(apt)}
                        >
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="text-center min-w-[52px]">
                                    <p className="text-sm font-semibold">{format(new Date(apt.startTime), "HH:mm")}</p>
                                    <p className="text-xs text-muted-foreground">{format(new Date(apt.startTime), "d MMM", { locale: ru })}</p>
                                </div>

                                <div className="w-px h-10 bg-border" />

                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{apt.patientName}</p>
                                    <p className="text-sm text-muted-foreground truncate">
                                        {apt.doctor.name} · {apt.service.name}
                                    </p>
                                    {apt.patientPhone && (
                                        <p className="text-xs text-muted-foreground">{apt.patientPhone}</p>
                                    )}
                                </div>

                                <StatusBadge status={apt.status} />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {selected && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40"
                    onClick={() => setSelected(null)}
                >
                    <div
                        className="bg-card rounded-2xl border border-border w-full max-w-md p-6 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-lg">{selected.patientName}</h3>
                            <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground text-xl">×</button>
                        </div>

                        <div className="space-y-1.5 text-sm">
                            <p><span className="text-muted-foreground">Дата: </span>{format(new Date(selected.startTime), "d MMMM yyyy, HH:mm", { locale: ru })}</p>
                            <p><span className="text-muted-foreground">Врач: </span>{selected.doctor.name}</p>
                            <p><span className="text-muted-foreground">Услуга: </span>{selected.service.name} ({selected.service.duration} мин)</p>
                            {selected.patientPhone && <p><span className="text-muted-foreground">Телефон: </span>{selected.patientPhone}</p>}
                            {selected.patientEmail && <p><span className="text-muted-foreground">Email: </span>{selected.patientEmail}</p>}
                            {selected.notes && <p><span className="text-muted-foreground">Комментарий: </span>{selected.notes}</p>}
                            <div className="flex items-center gap-2 pt-1">
                                <span className="text-muted-foreground">Статус: </span>
                                <StatusBadge status={selected.status} />
                            </div>
                        </div>

                        {!["COMPLETED", "CANCELLED_BY_CLINIC", "CANCELLED_BY_PATIENT"].includes(selected.status) && (
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                                {ACTIONS.filter((a) => a.status !== selected.status).map((action) => (
                                    <button
                                        key={action.status}
                                        disabled={statusLoading}
                                        onClick={() => changeStatus(selected.id, action.status)}
                                        className={`${action.color} text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50`}
                                    >
                                        {statusLoading ? "..." : action.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}