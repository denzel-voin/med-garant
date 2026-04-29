"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
    format, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
    addDays, startOfDay, endOfDay,
} from "date-fns";
import { ru } from "date-fns/locale";
import { dateFnsLocalizer } from "react-big-calendar";
import { Loader2, ChevronLeft, ChevronRight, Phone, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { useToast } from "@/components/ui/toast";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { getDay, parse } from "date-fns";

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
    getDay,
    locales: { "ru": ru },
});

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

const STATUS_FILTERS = [
    { value: "ALL", label: "Все" },
    { value: "PENDING", label: "Ожидает" },
    { value: "CONFIRMED", label: "Подтверждено" },
    { value: "COMPLETED", label: "Завершено" },
    { value: "CANCELLED", label: "Отменено" },
    { value: "NO_SHOW", label: "Не явился" },
] as const;

const TERMINAL = ["COMPLETED", "CANCELLED_BY_CLINIC", "CANCELLED_BY_PATIENT"];
const ACTIONS = [
    { status: "CONFIRMED", label: "Подтвердить", color: "bg-emerald-600" },
    { status: "COMPLETED", label: "Завершить", color: "bg-blue-600" },
    { status: "NO_SHOW", label: "Не явился", color: "bg-amber-500" },
    { status: "CANCELLED_BY_CLINIC", label: "Отменить", color: "bg-red-500" },
];

function statusBg(status: string) {
    switch (status) {
        case "PENDING": return "#fef3c7";
        case "CONFIRMED": return "#e0e7ff";
        case "COMPLETED": return "#d1fae5";
        case "NO_SHOW": return "#f3f4f6";
        default: return "#fee2e2";
    }
}
function statusFg(status: string) {
    switch (status) {
        case "PENDING": return "#92400e";
        case "CONFIRMED": return "#3730a3";
        case "COMPLETED": return "#065f46";
        case "NO_SHOW": return "#6b7280";
        default: return "#991b1b";
    }
}

export default function AppointmentsPage() {
    const { toast } = useToast();
    const [view, setView] = useState<View>("week");
    const [pivot, setPivot] = useState(new Date());
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Appointment | null>(null);
    const [statusLoading, setStatusLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [doctorFilter, setDoctorFilter] = useState("ALL");

    const { from, to } = useMemo(() => {
        if (view === "day") return { from: startOfDay(pivot), to: endOfDay(pivot) };
        if (view === "week") return {
            from: startOfWeek(pivot, { weekStartsOn: 1 }),
            to: endOfWeek(pivot, { weekStartsOn: 1 }),
        };
        return { from: startOfMonth(pivot), to: endOfMonth(pivot) };
    }, [view, pivot]);

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
    }, [from, to]);

    useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

    const doctors = useMemo(() => {
        const map = new Map<string, string>();
        appointments.forEach((a) => map.set(a.doctor.id, a.doctor.name));
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [appointments]);

    const filtered = useMemo(() => {
        return appointments.filter((a) => {
            const statusMatch =
                statusFilter === "ALL" ||
                (statusFilter === "CANCELLED"
                    ? ["CANCELLED_BY_CLINIC", "CANCELLED_BY_PATIENT"].includes(a.status)
                    : a.status === statusFilter);
            const doctorMatch = doctorFilter === "ALL" || a.doctor.id === doctorFilter;
            return statusMatch && doctorMatch;
        });
    }, [appointments, statusFilter, doctorFilter]);

    const rbcEvents = useMemo(() => filtered.map((a) => ({
        id: a.id,
        title: a.patientName,
        start: new Date(a.startTime),
        end: new Date(a.endTime),
        resource: a,
    })), [filtered]);

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
            {/* Nav */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex rounded-xl bg-[#F5F5F7] p-1">
                    {VIEWS.map((v) => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                                view === v ? "bg-white shadow-sm text-[#1D1D1F]" : "text-[#6E6E73] hover:text-[#1D1D1F]"
                            }`}
                        >
                            {{ day: "День", week: "Неделя", month: "Месяц" }[v]}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ChevronLeft className="size-4" />
                    </Button>
                    <span className="text-sm font-medium min-w-[160px] text-center capitalize">{periodLabel}</span>
                    <Button variant="ghost" size="icon" onClick={() => navigate(1)}>
                        <ChevronRight className="size-4" />
                    </Button>
                </div>

                <Button size="sm" variant="outline" onClick={() => setPivot(new Date())} className="ml-auto">
                    Сегодня
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-0.5 bg-[#F5F5F7] rounded-xl p-1">
                    {STATUS_FILTERS.map((f) => {
                        const count = f.value === "ALL"
                            ? appointments.length
                            : f.value === "CANCELLED"
                                ? appointments.filter((a) => ["CANCELLED_BY_CLINIC", "CANCELLED_BY_PATIENT"].includes(a.status)).length
                                : appointments.filter((a) => a.status === f.value).length;
                        return (
                            <button
                                key={f.value}
                                onClick={() => setStatusFilter(f.value)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                                    statusFilter === f.value ? "bg-white shadow-sm text-[#1D1D1F]" : "text-[#6E6E73] hover:text-[#1D1D1F]"
                                }`}
                            >
                                {f.label}
                                {count > 0 && (
                                    <span className={`rounded-full px-1.5 py-px text-[10px] leading-none font-semibold ${
                                        statusFilter === f.value ? "bg-blue-600/10 text-blue-600" : "bg-black/[0.06] text-[#6E6E73]"
                                    }`}>{count}</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {doctors.length > 1 && (
                    <select
                        value={doctorFilter}
                        onChange={(e) => setDoctorFilter(e.target.value)}
                        className="h-9 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                    >
                        <option value="ALL">Все специалисты</option>
                        {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                )}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
                    <Loader2 className="size-5 animate-spin" />
                    <span className="text-sm">Загружаем записи...</span>
                </div>
            ) : view === "day" ? (
                <DayListView appointments={filtered} onSelect={setSelected} />
            ) : (
                <div className="rbc-wrapper rounded-2xl border border-border overflow-hidden">
                    {/* @ts-ignore */}
                    <CalendarView
                        view={view}
                        pivot={pivot}
                        events={rbcEvents}
                        onSelectEvent={(e: { resource: Appointment }) => setSelected(e.resource)}
                        onNavigateDay={(date: Date) => { setPivot(date); setView("day"); }}
                        localizer={localizer}
                    />
                </div>
            )}

            {/* Detail modal */}
            {selected && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={() => setSelected(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-full max-w-md p-6 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-semibold text-lg">{selected.patientName}</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {format(new Date(selected.startTime), "d MMMM yyyy, HH:mm", { locale: ru })}
                                    {" — "}
                                    {format(new Date(selected.endTime), "HH:mm")}
                                </p>
                            </div>
                            <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
                        </div>

                        <div className="rounded-xl border border-border divide-y divide-border text-sm">
                            <InfoRow label="Врач" value={selected.doctor.name} />
                            <InfoRow label="Услуга" value={`${selected.service.name} (${selected.service.duration} мин)`} />
                            {selected.patientPhone && (
                                <div className="flex items-center justify-between px-3 py-2.5 gap-2">
                                    <span className="text-muted-foreground">Телефон</span>
                                    <a href={`tel:${selected.patientPhone}`} className="font-medium flex items-center gap-1.5 hover:text-primary">
                                        <Phone className="size-3.5" />{selected.patientPhone}
                                    </a>
                                </div>
                            )}
                            {selected.patientEmail && (
                                <div className="flex items-center justify-between px-3 py-2.5 gap-2">
                                    <span className="text-muted-foreground">Email</span>
                                    <a href={`mailto:${selected.patientEmail}`} className="font-medium flex items-center gap-1.5 hover:text-primary truncate max-w-[60%]">
                                        <Mail className="size-3.5 shrink-0" /><span className="truncate">{selected.patientEmail}</span>
                                    </a>
                                </div>
                            )}
                            {selected.notes && (
                                <div className="flex items-start gap-2 px-3 py-2.5">
                                    <span className="text-muted-foreground flex items-center gap-1 shrink-0"><MessageSquare className="size-3.5" />Заметка</span>
                                    <span className="font-medium ml-auto max-w-[60%] text-right">{selected.notes}</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between px-3 py-2.5 gap-2">
                                <span className="text-muted-foreground">Статус</span>
                                <StatusBadge status={selected.status} />
                            </div>
                        </div>

                        {!TERMINAL.includes(selected.status) && (
                            <div className="flex flex-wrap gap-2 pt-1">
                                {ACTIONS.filter((a) => a.status !== selected.status).map((action) => (
                                    <button
                                        key={action.status}
                                        disabled={statusLoading}
                                        onClick={() => changeStatus(selected.id, action.status)}
                                        className={`${action.color} text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity`}
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

// ─── react-big-calendar wrapper ───────────────────────────────────────────────

import { Calendar, Views } from "react-big-calendar";

interface RbcEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    resource: Appointment;
}

function CalendarView({ view, pivot, events, onSelectEvent, onNavigateDay, localizer }: {
    view: "week" | "month";
    pivot: Date;
    events: RbcEvent[];
    onSelectEvent: (e: RbcEvent) => void;
    onNavigateDay: (date: Date) => void;
    localizer: ReturnType<typeof dateFnsLocalizer>;
}) {
    const eventStyleGetter = (event: RbcEvent) => {
        const apt = event.resource;
        return {
            style: {
                backgroundColor: statusBg(apt.status),
                color: statusFg(apt.status),
                border: "none",
                borderRadius: 8,
                fontSize: 12,
                padding: "2px 6px",
            },
        };
    };

    const formats = {
        timeGutterFormat: "HH:mm",
        eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
            `${format(start, "HH:mm")} – ${format(end, "HH:mm")}`,
        dayHeaderFormat: (date: Date) => format(date, "EEE d MMM", { locale: ru }),
        monthHeaderFormat: (date: Date) => format(date, "LLLL yyyy", { locale: ru }),
        weekdayFormat: (date: Date) => format(date, "EEE", { locale: ru }),
        dayFormat: (date: Date) => format(date, "EEE d", { locale: ru }),
        dateFormat: (date: Date) => format(date, "d"),
    };

    return (
        <Calendar
            localizer={localizer}
            events={events}
            view={view === "week" ? Views.WEEK : Views.MONTH}
            date={pivot}
            onNavigate={() => {}}
            toolbar={false}
            onSelectEvent={onSelectEvent}
            onDrillDown={onNavigateDay}
            eventPropGetter={eventStyleGetter}
            formats={formats}
            style={{ height: view === "week" ? 680 : 640 }}
            messages={{
                noEventsInRange: "Нет записей",
                showMore: (count: number) => `+${count} ещё`,
            }}
            dayLayoutAlgorithm="no-overlap"
            startAccessor="start"
            endAccessor="end"
            min={new Date(0, 0, 0, 8, 0)}
            max={new Date(0, 0, 0, 20, 0)}
        />
    );
}

// ─── Day list view ────────────────────────────────────────────────────────────

function DayListView({ appointments, onSelect }: {
    appointments: Appointment[];
    onSelect: (a: Appointment) => void;
}) {
    if (appointments.length === 0) {
        return (
            <div className="text-center py-20 text-muted-foreground">
                <p className="font-medium">Записей нет</p>
                <p className="text-sm mt-1">На этот день нет ни одной записи</p>
            </div>
        );
    }
    return (
        <div className="space-y-2">
            {[...appointments]
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                .map((apt) => (
                    <button
                        key={apt.id}
                        onClick={() => onSelect(apt)}
                        className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all text-left"
                    >
                        <div className="text-center min-w-[52px]">
                            <p className="text-sm font-semibold">{format(new Date(apt.startTime), "HH:mm")}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(apt.endTime), "HH:mm")}</p>
                        </div>
                        <div className="w-px h-10 bg-border" />
                        <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{apt.patientName}</p>
                            <p className="text-sm text-muted-foreground truncate">
                                {apt.doctor.name} · {apt.service.name}
                            </p>
                        </div>
                        <StatusBadge status={apt.status} />
                    </button>
                ))}
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between px-3 py-2.5 gap-2">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium text-right">{value}</span>
        </div>
    );
}
