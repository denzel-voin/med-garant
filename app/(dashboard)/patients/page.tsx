"use client";

import React, { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Search, Loader2, ChevronLeft, ChevronRight, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { useToast } from "@/components/ui/toast";

interface Appointment {
    id: string;
    startTime: string;
    status: string;
    doctor: { name: string };
    service: { name: string };
}

interface Patient {
    id: string;
    fullName: string;
    phone: string;
    email?: string | null;
    notes?: string | null;
    createdAt: string;
    appointments: Appointment[];
}

export default function PatientsPage() {
    const { toast } = useToast();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Patient | null>(null);
    const [notes, setNotes] = useState("");
    const [savingNotes, setSavingNotes] = useState(false);

    const fetchPatients = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), ...(search ? { search } : {}) });
            const res = await fetch(`/api/v1/patients?${params}`);
            if (res.ok) {
                const data = await res.json();
                setPatients(data.patients);
                setTotal(data.total);
                setPages(data.pages);
            }
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => { fetchPatients(); }, [fetchPatients]);

    useEffect(() => {
        const t = setTimeout(() => setPage(1), 400);
        return () => clearTimeout(t);
    }, [search]);

    function openPatient(p: Patient) {
        setSelected(p);
        setNotes(p.notes ?? "");
    }

    async function saveNotes() {
        if (!selected) return;
        setSavingNotes(true);
        try {
            const res = await fetch(`/api/v1/patients/${selected.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notes }),
            });
            if (res.ok) {
                toast("Заметка сохранена", "success");
                setSelected((p) => p ? { ...p, notes } : null);
                setPatients((list) => list.map((p) => p.id === selected.id ? { ...p, notes } : p));
            } else toast("Ошибка сохранения", "error");
        } finally {
            setSavingNotes(false);
        }
    }

    return (
        <div className="space-y-4 max-w-3xl">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                    className="pl-9"
                    placeholder="Поиск по имени, телефону или email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <p className="text-sm text-muted-foreground">
                {total} пациент(ов) найдено
            </p>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
            ) : patients.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <User className="size-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Пациентов не найдено</p>
                    {search && <p className="text-sm mt-1">Попробуйте изменить запрос</p>}
                </div>
            ) : (
                <>
                    <div className="space-y-2">
                        {patients.map((p) => (
                            <Card
                                key={p.id}
                                className="cursor-pointer hover:border-primary/30 transition-all"
                                onClick={() => openPatient(p)}
                            >
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                                        <User className="size-5 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{p.fullName}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {p.phone}
                                            {p.email && ` · ${p.email}`}
                                        </p>
                                    </div>
                                    <div className="text-right text-sm text-muted-foreground shrink-0">
                                        <p>{p.appointments.length} визит(ов)</p>
                                        <p className="text-xs">
                                            С {format(new Date(p.createdAt), "d MMM yyyy", { locale: ru })}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {pages > 1 && (
                        <div className="flex items-center justify-center gap-3 pt-2">
                            <Button
                                variant="ghost" size="icon"
                                disabled={page === 1}
                                onClick={() => setPage((p) => p - 1)}
                            >
                                <ChevronLeft className="size-4" />
                            </Button>
                            <span className="text-sm text-muted-foreground">
                Страница {page} из {pages}
              </span>
                            <Button
                                variant="ghost" size="icon"
                                disabled={page === pages}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>
                    )}
                </>
            )}

            {selected && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40"
                    onClick={() => setSelected(null)}
                >
                    <div
                        className="bg-card rounded-2xl border border-border w-full max-w-lg p-6 space-y-5 max-h-[85vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="font-semibold text-lg">{selected.fullName}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {selected.phone}
                                    {selected.email && ` · ${selected.email}`}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelected(null)}
                                className="text-muted-foreground hover:text-foreground text-xl shrink-0"
                            >
                                ×
                            </button>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">
                                История визитов ({selected.appointments.length})
                            </p>
                            {selected.appointments.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Нет визитов</p>
                            ) : (
                                <div className="space-y-1.5">
                                    {selected.appointments.map((a) => (
                                        <div
                                            key={a.id}
                                            className="flex items-center justify-between text-sm rounded-xl bg-muted/50 px-3 py-2 gap-2"
                                        >
                                            <div className="min-w-0">
                        <span className="font-medium">
                          {format(new Date(a.startTime), "d MMM yyyy, HH:mm", { locale: ru })}
                        </span>
                                                <span className="text-muted-foreground ml-2">
                          {a.doctor.name} · {a.service.name}
                        </span>
                                            </div>
                                            <StatusBadge status={a.status} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium">
                                Заметка{" "}
                                <span className="text-muted-foreground font-normal">(только для персонала)</span>
                            </p>
                            <textarea
                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring/50"
                                rows={3}
                                placeholder="Аллергии, особые пожелания, важная информация..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                            <Button size="sm" onClick={saveNotes} disabled={savingNotes}>
                                {savingNotes ? "Сохраняем..." : "Сохранить заметку"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}