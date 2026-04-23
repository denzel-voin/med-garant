"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Power, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

interface Service { id: string; name: string; duration: number; price?: number | null }
interface Schedule { id: string; weekday: number; startTime: string; endTime: string; isActive: boolean }
interface Doctor {
    id: string; name: string; speciality?: string | null; bio?: string | null;
    email?: string | null; avatarUrl?: string | null; isActive: boolean;
    services: Service[]; schedules: Schedule[];
}

const DAYS = ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"];

type Modal = null | { mode: "add" | "edit"; doctor?: Doctor } | { mode: "schedule"; doctor: Doctor };

export default function DoctorsPage() {
    const { toast } = useToast();
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [allServices, setAllServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<Modal>(null);
    const [form, setForm] = useState({ name: "", speciality: "", bio: "", email: "", avatarUrl: "", serviceIds: [] as string[] });
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const [scheduleRows, setScheduleRows] = useState<{ weekday: number; startTime: string; endTime: string; isActive: boolean }[]>(
        Array.from({ length: 7 }, (_, i) => ({ weekday: i, startTime: "09:00", endTime: "18:00", isActive: i >= 1 && i <= 5 }))
    );

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [docRes, svcRes] = await Promise.all([
            fetch("/api/v1/doctors"),
            fetch("/api/v1/services"),
        ]);
        if (docRes.ok) setDoctors(await docRes.json());
        if (svcRes.ok) setAllServices(await svcRes.json());
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    function openAdd() {
        setForm({ name: "", speciality: "", bio: "", email: "", avatarUrl: "", serviceIds: [] });
        setModal({ mode: "add" });
    }
    function openEdit(d: Doctor) {
        setForm({
            name: d.name,
            speciality: d.speciality ?? "",
            bio: d.bio ?? "",
            email: d.email ?? "",
            avatarUrl: d.avatarUrl ?? "",
            serviceIds: d.services.map((s) => s.id),
        });
        setModal({ mode: "edit", doctor: d });
    }
    function openSchedule(d: Doctor) {
        const rows = Array.from({ length: 7 }, (_, i) => {
            const existing = d.schedules.find((s) => s.weekday === i);
            return existing
                ? { weekday: i, startTime: existing.startTime, endTime: existing.endTime, isActive: existing.isActive }
                : { weekday: i, startTime: "09:00", endTime: "18:00", isActive: i >= 1 && i <= 5 };
        });
        setScheduleRows(rows);
        setModal({ mode: "schedule", doctor: d });
    }

    async function handleSave() {
        if (!form.name.trim()) return;
        setSaving(true);
        try {
            const isEdit = modal?.mode === "edit";
            const url = isEdit ? `/api/v1/doctors/${(modal as { mode: "edit"; doctor: Doctor }).doctor.id}` : "/api/v1/doctors";
            const res = await fetch(url, {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                toast(isEdit ? "Данные сохранены" : "Специалист добавлен", "success");
                fetchData();
                setModal(null);
            } else {
                toast("Ошибка сохранения", "error");
            }
        } finally {
            setSaving(false);
        }
    }

    async function handleAvatarFile(file: File) {
        const formData = new FormData();
        formData.append("file", file);
        setUploadingAvatar(true);
        try {
            const res = await fetch("/api/v1/uploads", { method: "POST", body: formData });
            const data = await res.json();
            if (!res.ok) {
                toast(data.error?.message ?? "Ошибка загрузки файла", "error");
                return;
            }
            setForm((f) => ({ ...f, avatarUrl: data.url ?? "" }));
            toast("Фото загружено", "success");
        } catch {
            toast("Ошибка загрузки файла", "error");
        } finally {
            setUploadingAvatar(false);
        }
    }

    async function toggleActive(d: Doctor) {
        const res = await fetch(`/api/v1/doctors/${d.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: !d.isActive }),
        });
        if (res.ok) {
            toast(d.isActive ? "Специалист деактивирован. Все будущие записи отменены." : "Специалист активирован", d.isActive ? "info" : "success");
            fetchData();
        }
    }

    async function saveSchedule() {
        if (modal?.mode !== "schedule") return;
        setSaving(true);
        const active = scheduleRows.filter((r) => r.isActive);
        const res = await fetch(`/api/v1/doctors/${modal.doctor.id}/schedule`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(active),
        });
        setSaving(false);
        if (res.ok) { toast("Расписание сохранено", "success"); fetchData(); setModal(null); }
        else toast("Ошибка сохранения", "error");
    }

    return (
        <div className="space-y-4 max-w-3xl">
            <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">{doctors.length} специалист(ов)</p>
                <Button size="sm" onClick={openAdd}><Plus className="size-4 mr-1" />Добавить</Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
            ) : doctors.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <p className="font-medium">Нет специалистов</p>
                    <p className="text-sm mt-1">Добавьте первого специалиста</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {doctors.map((d) => (
                        <Card key={d.id} className={!d.isActive ? "opacity-60" : ""}>
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="size-10 rounded-xl bg-muted flex items-center justify-center shrink-0 text-lg overflow-hidden">
                                    {d.avatarUrl ? (
                                        <img src={d.avatarUrl} alt={d.name} className="size-full object-cover" />
                                    ) : (
                                        "👤"
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium truncate">{d.name}</p>
                                        {!d.isActive && <Badge variant="secondary">Неактивен</Badge>}
                                    </div>
                                    {d.speciality && <p className="text-sm text-muted-foreground">{d.speciality}</p>}
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {d.services.length} услуг ·{" "}
                                        {d.schedules.filter((s) => s.isActive).map((s) => DAYS[s.weekday]).join(", ") || "расписание не задано"}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => openSchedule(d)} title="Расписание">
                                        <Clock className="size-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => openEdit(d)} title="Редактировать">
                                        <Pencil className="size-4" />
                                    </Button>
                                    <Button
                                        variant="ghost" size="icon"
                                        onClick={() => toggleActive(d)}
                                        title={d.isActive ? "Деактивировать" : "Активировать"}
                                        className={d.isActive ? "text-red-500 hover:text-red-600" : "text-emerald-500 hover:text-emerald-600"}
                                    >
                                        <Power className="size-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {(modal?.mode === "add" || modal?.mode === "edit") && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setModal(null)}>
                    <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-lg">{modal.mode === "add" ? "Новый специалист" : "Редактировать"}</h3>
                            <button onClick={() => setModal(null)} className="text-muted-foreground hover:text-foreground text-xl">×</button>
                        </div>
                        <div className="space-y-3">
                            <div className="space-y-1"><Label>ФИО *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Иванова Мария Петровна" /></div>
                            <div className="space-y-1"><Label>Специальность</Label><Input value={form.speciality} onChange={(e) => setForm((f) => ({ ...f, speciality: e.target.value }))} placeholder="Косметолог, Стоматолог…" /></div>
                            <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="doctor@clinic.ru" /></div>
                            <div className="space-y-1">
                                <Label>Фото специалиста</Label>
                                <Input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleAvatarFile(file);
                                    }}
                                />
                                <p className="text-xs text-muted-foreground">JPG, PNG или WEBP, до 5 МБ</p>
                                {uploadingAvatar && (
                                    <p className="text-xs text-muted-foreground">Загружаем фото...</p>
                                )}
                                {form.avatarUrl && (
                                    <div className="pt-2 flex items-center gap-2">
                                        <img
                                            src={form.avatarUrl}
                                            alt="Предпросмотр"
                                            className="size-16 rounded-xl border border-border object-cover"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setForm((f) => ({ ...f, avatarUrl: "" }))}
                                        >
                                            Удалить фото
                                        </Button>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-1"><Label>Описание</Label><Textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} placeholder="Краткое описание специалиста..." rows={2} /></div>
                            <div className="space-y-2">
                                <Label>Услуги специалиста</Label>
                                {allServices.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Сначала добавьте услуги в разделе "Услуги".</p>
                                ) : (
                                    <div className="max-h-40 overflow-y-auto rounded-xl border border-border p-2 space-y-1.5">
                                        {allServices.map((service) => {
                                            const checked = form.serviceIds.includes(service.id);
                                            return (
                                                <label key={service.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50 cursor-pointer">
                                                    <span className="text-sm">{service.name}</span>
                                                    <input
                                                        type="checkbox"
                                                        className="accent-primary"
                                                        checked={checked}
                                                        onChange={(e) =>
                                                            setForm((f) => ({
                                                                ...f,
                                                                serviceIds: e.target.checked
                                                                    ? [...f.serviceIds, service.id]
                                                                    : f.serviceIds.filter((id) => id !== service.id),
                                                            }))
                                                        }
                                                    />
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button variant="outline" className="flex-1" onClick={() => setModal(null)}>Отмена</Button>
                            <Button className="flex-1" onClick={handleSave} disabled={saving || uploadingAvatar || !form.name.trim()}>{saving ? "Сохраняем..." : "Сохранить"}</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule modal */}
            {modal?.mode === "schedule" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setModal(null)}>
                    <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-lg">Расписание — {modal.doctor.name}</h3>
                            <button onClick={() => setModal(null)} className="text-muted-foreground hover:text-foreground text-xl">×</button>
                        </div>
                        <div className="space-y-2">
                            {scheduleRows.map((row, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <label className="flex items-center gap-1.5 w-10 cursor-pointer">
                                        <input type="checkbox" className="accent-primary" checked={row.isActive}
                                               onChange={(e) => setScheduleRows((rows) => rows.map((r, j) => j === i ? { ...r, isActive: e.target.checked } : r))} />
                                        <span className="text-sm font-medium">{DAYS[row.weekday]}</span>
                                    </label>
                                    <input type="time" value={row.startTime} disabled={!row.isActive}
                                           onChange={(e) => setScheduleRows((rows) => rows.map((r, j) => j === i ? { ...r, startTime: e.target.value } : r))}
                                           className="flex-1 rounded-lg border border-border px-2 py-1 text-sm bg-background disabled:opacity-40" />
                                    <span className="text-muted-foreground text-sm">—</span>
                                    <input type="time" value={row.endTime} disabled={!row.isActive}
                                           onChange={(e) => setScheduleRows((rows) => rows.map((r, j) => j === i ? { ...r, endTime: e.target.value } : r))}
                                           className="flex-1 rounded-lg border border-border px-2 py-1 text-sm bg-background disabled:opacity-40" />
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button variant="outline" className="flex-1" onClick={() => setModal(null)}>Отмена</Button>
                            <Button className="flex-1" onClick={saveSchedule} disabled={saving}>{saving ? "Сохраняем..." : "Сохранить расписание"}</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}