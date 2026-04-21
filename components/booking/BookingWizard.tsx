"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CheckCircle, ArrowLeft, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DoctorCard } from "./DoctorCard";
import { SlotPicker } from "./SlotPicker";
import { SymptomAssistant } from "./SymptomAssistant";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Service {
    id: string;
    name: string;
    duration: number;
    price?: number | null;
}

interface Doctor {
    id: string;
    name: string;
    speciality?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    services: Service[];
}

interface Slot {
    startTime: string;
    endTime: string;
}

interface PatientSession {
    userId: string;
    fullName: string;
    phone: string | null;
    email: string;
}

interface Props {
    slug: string;
    doctors: Doctor[];
    primaryColor?: string;
    compact?: boolean;
}

type Step = "doctor" | "slot" | "form" | "done";

export function BookingWizard({ slug, doctors, primaryColor, compact }: Props) {
    const [step, setStep] = useState<Step>("doctor");
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "", consent: false });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [bookingResult, setBookingResult] = useState<{ id: string } | null>(null);

    // ── Patient session ──────────────────────────────────────────────────────
    const [patient, setPatient] = useState<PatientSession | null>(null);
    const [patientLoading, setPatientLoading] = useState(true);

    useEffect(() => {
        // Single call — /patient/me returns email + fullName + phone
        fetch("/api/v1/patient/me")
            .then(async (res) => {
                if (!res.ok) return; // not logged in — silent, that's fine
                const me = await res.json();
                setPatient({
                    userId: me.userId ?? "",
                    fullName: me.fullName ?? "",
                    phone: me.phone ?? null,
                    email: me.email ?? "",
                });
            })
            .catch(() => { /* network error — continue as guest */ })
            .finally(() => setPatientLoading(false));
    }, []);

    // Pre-fill form when patient is known
    useEffect(() => {
        if (patient) {
            setForm((f) => ({
                ...f,
                name: patient.fullName || f.name,
                phone: patient.phone || f.phone,
                email: patient.email || f.email,
                consent: true,  // patient already accepted ToS on registration
            }));
        }
    }, [patient]);

    function handleAIRecommend(doctorId: string) {
        const doc = doctors.find((d) => d.id === doctorId);
        if (doc) {
            setSelectedDoctor(doc);
            setSelectedService(doc.services[0] ?? null);
        }
    }

    function goToSlot() {
        if (!selectedDoctor || !selectedService) return;
        setStep("slot");
    }

    function handleSlotSelect(slot: Slot | null, date: Date) {
        setSelectedDate(date);
        if (slot) {
            setSelectedSlot(slot);
        } else {
            setSelectedSlot(null);
        }
    }

    function goToForm() {
        if (!selectedSlot) return;
        setStep("form");
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.consent) { setError("Необходимо согласие на обработку данных"); return; }
        if (!selectedDate || !selectedSlot || !selectedDoctor || !selectedService) return;

        setLoading(true);
        setError("");

        try {
            const [h, m] = selectedSlot.startTime.split(":").map(Number);
            const dt = new Date(selectedDate);
            dt.setHours(h, m, 0, 0);

            const res = await fetch(`/api/v1/tenants/${slug}/appointments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",   // send cookies so server can read access_token
                body: JSON.stringify({
                    doctorId: selectedDoctor.id,
                    serviceId: selectedService.id,
                    startTime: dt.toISOString(),
                    patientName: form.name,
                    patientPhone: form.phone || undefined,
                    patientEmail: form.email || undefined,
                    notes: form.notes || undefined,
                    linkToPatientAccount: true,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 409) {
                    setError("Это время уже занято. Вернитесь и выберите другой слот.");
                } else {
                    setError(data.error?.message ?? "Произошла ошибка. Попробуйте снова.");
                }
                return;
            }

            setBookingResult(data);
            setStep("done");
        } catch {
            setError("Ошибка сети. Проверьте подключение.");
        } finally {
            setLoading(false);
        }
    }

    const steps = [
        { key: "doctor", label: "Специалист" },
        { key: "slot", label: "Время" },
        { key: "form", label: "Данные" },
    ];

    const stepIndex = { doctor: 0, slot: 1, form: 2, done: 3 }[step];

    const wrapClass = compact ? "p-4 space-y-4" : "space-y-6";

    if (step === "done") {
        return (
            <div className={cn(wrapClass, "text-center py-8")}>
                <CheckCircle className="size-14 text-emerald-500 mx-auto" />
                <h3 className="text-xl font-semibold mt-4">Запись создана!</h3>
                <p className="text-muted-foreground text-sm mt-2">
                    {form.email
                        ? "Подтверждение и напоминание отправлены на ваш email."
                        : "Ждём вас в назначенное время."}
                </p>
                {selectedDate && selectedSlot && (
                    <div className="mt-4 rounded-2xl border border-border p-4 text-sm text-left inline-block mx-auto">
                        <p>
                            <span className="text-muted-foreground">Врач: </span>
                            <strong>{selectedDoctor?.name}</strong>
                        </p>
                        <p>
                            <span className="text-muted-foreground">Услуга: </span>
                            {selectedService?.name}
                        </p>
                        <p>
                            <span className="text-muted-foreground">Дата: </span>
                            {format(selectedDate, "d MMMM yyyy", { locale: ru })}, {selectedSlot.startTime}
                        </p>
                    </div>
                )}
                <Button
                    className="mt-6"
                    variant="outline"
                    onClick={() => {
                        setStep("doctor");
                        setSelectedDoctor(null);
                        setSelectedService(null);
                        setSelectedSlot(null);
                        setSelectedDate(null);
                        setForm({ name: "", phone: "", email: "", notes: "", consent: false });
                    }}
                >
                    Записаться ещё раз
                </Button>
                {patient && (
                    <Link
                        href="/me"
                        className="mt-3 block text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                    >
                        Посмотреть мои записи →
                    </Link>
                )}
            </div>
        );
    }

    return (
        <div className={wrapClass}>
            {!compact && (
                <div className="flex gap-2 items-center">
                    {steps.map((s, i) => (
                        <React.Fragment key={s.key}>
                            <div
                                className={cn(
                                    "flex items-center gap-1.5 text-sm",
                                    i < stepIndex ? "text-primary font-medium" : i === stepIndex ? "text-foreground font-semibold" : "text-muted-foreground"
                                )}
                            >
                                <div
                                    className={cn(
                                        "size-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                                        i < stepIndex
                                            ? "bg-primary border-primary text-primary-foreground"
                                            : i === stepIndex
                                                ? "border-primary text-primary"
                                                : "border-border text-muted-foreground"
                                    )}
                                >
                                    {i < stepIndex ? "✓" : i + 1}
                                </div>
                                <span className="hidden sm:block">{s.label}</span>
                            </div>
                            {i < steps.length - 1 && (
                                <div className={cn("flex-1 h-px", i < stepIndex ? "bg-primary" : "bg-border")} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            )}

            {step === "doctor" && (
                <div className="space-y-4">
                    <SymptomAssistant slug={slug} doctors={doctors} onRecommend={handleAIRecommend} />

                    <div className="space-y-2">
                        {doctors.map((doc) => (
                            <DoctorCard
                                key={doc.id}
                                doctor={doc}
                                selected={selectedDoctor?.id === doc.id}
                                selectedService={selectedDoctor?.id === doc.id ? selectedService : null}
                                onSelect={(d) => {
                                    setSelectedDoctor(d);
                                    setSelectedService(d.services[0] ?? null);
                                }}
                                onServiceSelect={setSelectedService}
                            />
                        ))}
                    </div>

                    {selectedDoctor && selectedDoctor.services.length === 0 && (
                        <p className="text-sm text-amber-700 bg-amber-50 dark:bg-amber-950/30 rounded-xl px-3 py-2">
                            У выбранного специалиста пока нет активных услуг. Добавьте услугу в панели администратора.
                        </p>
                    )}

                    <Button
                        className="w-full"
                        disabled={!selectedDoctor || !selectedService}
                        onClick={goToSlot}
                    >
                        Выбрать время →
                    </Button>
                </div>
            )}

            {step === "slot" && (
                <div className="space-y-4">
                    <button
                        onClick={() => setStep("doctor")}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" /> Назад
                    </button>

                    <div className="rounded-2xl border border-border p-3 text-sm">
                        <span className="text-muted-foreground">Врач: </span>
                        <strong>{selectedDoctor?.name}</strong>
                        <span className="mx-2 text-muted-foreground">·</span>
                        {selectedService?.name}
                        <span className="mx-2 text-muted-foreground">·</span>
                        {selectedService?.duration} мин
                    </div>

                    <SlotPicker
                        slug={slug}
                        doctorId={selectedDoctor!.id}
                        serviceId={selectedService!.id}
                        selectedSlot={selectedSlot}
                        onSelect={handleSlotSelect}
                    />

                    <Button className="w-full" disabled={!selectedSlot} onClick={goToForm}>
                        Продолжить →
                    </Button>
                </div>
            )}

            {step === "form" && (
                <div className="space-y-4">
                    <button
                        onClick={() => setStep("slot")}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" /> Назад
                    </button>

                    <div className="rounded-2xl border border-border p-3 text-sm space-y-0.5">
                        <p><span className="text-muted-foreground">Врач: </span><strong>{selectedDoctor?.name}</strong></p>
                        <p><span className="text-muted-foreground">Услуга: </span>{selectedService?.name}</p>
                        {selectedDate && selectedSlot && (
                            <p>
                                <span className="text-muted-foreground">Дата: </span>
                                {format(selectedDate, "d MMMM yyyy", { locale: ru })}, {selectedSlot.startTime}–{selectedSlot.endTime}
                            </p>
                        )}
                    </div>

                    {/* Patient session banner */}
                    {patient ? (
                        <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 px-3 py-2.5">
                            <UserCheck className="size-4 text-emerald-600 shrink-0" />
                            <div className="text-sm">
                                <span className="font-medium text-emerald-700 dark:text-emerald-400">
                                    {patient.fullName}
                                </span>
                                <span className="text-muted-foreground"> — данные подставлены автоматически</span>
                            </div>
                            <Link
                                href="/me"
                                className="ml-auto text-xs text-emerald-600 hover:underline shrink-0"
                            >
                                Мои записи
                            </Link>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl px-3 py-2">
                            <span>Есть аккаунт?</span>
                            <Link href="/login-patient" className="text-foreground underline underline-offset-2 hover:opacity-80">
                                Войти
                            </Link>
                            <span>— данные заполнятся автоматически</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="pat-name">ФИО *</Label>
                            <Input
                                id="pat-name"
                                placeholder="Иванова Мария Петровна"
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                required
                                minLength={2}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="pat-phone">Телефон</Label>
                            <Input
                                id="pat-phone"
                                type="tel"
                                placeholder="+7 (999) 123-45-67"
                                value={form.phone}
                                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="pat-email">Email (для подтверждения)</Label>
                            <Input
                                id="pat-email"
                                type="email"
                                placeholder="maria@example.com"
                                value={form.email}
                                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="pat-notes">Комментарий (необязательно)</Label>
                            <Textarea
                                id="pat-notes"
                                placeholder="Пожелания или дополнительная информация..."
                                value={form.notes}
                                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                                rows={2}
                            />
                        </div>

                        {/* Hide consent checkbox if patient is already logged in (accepted ToS on registration) */}
                        {!patient && (
                            <label className="flex items-start gap-2.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="mt-1 size-4 rounded border-border accent-primary"
                                    checked={form.consent}
                                    onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
                                />
                                <span className="text-xs text-muted-foreground leading-relaxed">
                                    Я даю согласие на обработку персональных данных в соответствии с&nbsp;
                                    <span className="underline cursor-pointer">политикой конфиденциальности</span>
                                </span>
                            </label>
                        )}

                        {error && (
                            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-xl px-3 py-2">
                                {error}
                            </p>
                        )}

                        <Button type="submit" className="w-full" disabled={loading || !form.consent}>
                            {loading ? "Создаём запись..." : "Записаться"}
                        </Button>
                    </form>
                </div>
            )}
        </div>
    );
}