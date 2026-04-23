"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Power, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

interface Service {
    id: string; name: string; duration: number;
    price?: number | null; description?: string | null; isActive: boolean;
}

type Modal = null | { mode: "add" | "edit"; service?: Service };

export default function ServicesPage() {
    const { toast } = useToast();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<Modal>(null);
    const [form, setForm] = useState({ name: "", duration: "30", price: "", description: "" });
    const [saving, setSaving] = useState(false);

    const fetchServices = useCallback(async () => {
        setLoading(true);
        const res = await fetch("/api/v1/services");
        if (res.ok) setServices(await res.json());
        setLoading(false);
    }, []);

    useEffect(() => { fetchServices(); }, [fetchServices]);

    function openAdd() {
        setForm({ name: "", duration: "30", price: "", description: "" });
        setModal({ mode: "add" });
    }
    function openEdit(s: Service) {
        setForm({ name: s.name, duration: String(s.duration), price: s.price != null ? String(s.price) : "", description: s.description ?? "" });
        setModal({ mode: "edit", service: s });
    }

    async function handleSave() {
        if (!form.name.trim() || !form.duration) return;
        setSaving(true);
        try {
            const isEdit = modal?.mode === "edit";
            const url = isEdit ? `/api/v1/services/${(modal as { mode: "edit"; service: Service }).service.id}` : "/api/v1/services";
            const body = {
                name: form.name,
                duration: parseInt(form.duration),
                price: form.price ? parseInt(form.price) : undefined,
                description: form.description || undefined,
            };
            const res = await fetch(url, {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                toast(isEdit ? "Услуга обновлена" : "Услуга добавлена", "success");
                fetchServices();
                setModal(null);
            } else toast("Ошибка сохранения", "error");
        } finally {
            setSaving(false);
        }
    }

    async function toggleActive(s: Service) {
        const res = await fetch(`/api/v1/services/${s.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: !s.isActive }),
        });
        if (res.ok) { toast("Статус изменён", "success"); fetchServices(); }
        else toast("Ошибка", "error");
    }

    return (
        <div className="space-y-4 max-w-2xl">
            <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">{services.length} услуг(и)</p>
                <Button size="sm" onClick={openAdd}><Plus className="size-4 mr-1" />Добавить</Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
            ) : services.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <p className="font-medium">Нет услуг</p>
                    <p className="text-sm mt-1">Добавьте первую услугу</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {services.map((s) => (
                        <Card key={s.id} className={!s.isActive ? "opacity-60" : ""}>
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium truncate">{s.name}</p>
                                        {!s.isActive && <Badge variant="secondary">Неактивна</Badge>}
                                    </div>
                                    <div className="flex items-center gap-3 mt-0.5 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1"><Clock className="size-3" />{s.duration} мин</span>
                                        {s.price != null && <span>{s.price.toLocaleString("ru-RU")} ₽</span>}
                                    </div>
                                    {s.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{s.description}</p>}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="size-4" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => toggleActive(s)}
                                            className={s.isActive ? "text-red-500 hover:text-red-600" : "text-emerald-500 hover:text-emerald-600"}>
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
                            <h3 className="font-semibold text-lg">{modal.mode === "add" ? "Новая услуга" : "Редактировать услугу"}</h3>
                            <button onClick={() => setModal(null)} className="text-muted-foreground hover:text-foreground text-xl">×</button>
                        </div>
                        <div className="space-y-3">
                            <div className="space-y-1"><Label>Название *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Чистка кожи, Отбеливание зубов…" /></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1"><Label>Длительность (мин) *</Label><Input type="number" min="5" max="480" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} /></div>
                                <div className="space-y-1"><Label>Цена (₽)</Label><Input type="number" min="0" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="Необязательно" /></div>
                            </div>
                            <div className="space-y-1"><Label>Описание</Label><Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="Краткое описание услуги..." /></div>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button variant="outline" className="flex-1" onClick={() => setModal(null)}>Отмена</Button>
                            <Button className="flex-1" onClick={handleSave} disabled={saving || !form.name.trim() || !form.duration}>{saving ? "Сохраняем..." : "Сохранить"}</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}