"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SymptomAssistant } from "@/components/booking/SymptomAssistant";
import { YandexClinicMap } from "@/components/maps/YandexClinicMap";
import { Input } from "@/components/ui/input";

type Doctor = {
    id: string;
    name: string;
    speciality?: string | null;
    servicesCount: number;
};

type Clinic = {
    id: string;
    name: string;
    slug: string;
    address?: string | null;
    phone?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    doctors: Doctor[];
};

export function HomeCatalog({ initialView, clinics }: { initialView: "clinics" | "doctors"; clinics: Clinic[] }) {
    const [view, setView] = useState<"clinics" | "doctors">(initialView);
    const [query, setQuery] = useState("");
    const [assistantClinicSlug, setAssistantClinicSlug] = useState<string>(clinics[0]?.slug ?? "");
    const [recommendedDoctorId, setRecommendedDoctorId] = useState<string | null>(null);

    const filteredClinics = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return clinics;
        return clinics.filter((clinic) => {
            if (clinic.name.toLowerCase().includes(q)) return true;
            return clinic.doctors.some(
                (d) =>
                    d.name.toLowerCase().includes(q) ||
                    (d.speciality ?? "").toLowerCase().includes(q)
            );
        });
    }, [clinics, query]);

    const doctorsView = useMemo(
        () =>
            filteredClinics.flatMap((clinic) =>
                clinic.doctors.map((doctor) => ({
                    clinicName: clinic.name,
                    clinicSlug: clinic.slug,
                    doctor,
                }))
            ),
        [filteredClinics]
    );

    const assistantClinic = clinics.find((c) => c.slug === assistantClinicSlug) ?? clinics[0];

    return (
        <section className="mx-auto max-w-5xl px-4 py-10 space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight">Онлайн запись в клиники</h1>
                <p className="text-muted-foreground">Выберите клинику или специалиста и перейдите к записи.</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <Input
                    placeholder="Поиск по клинике, специалисту или специальности..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <select
                    className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    value={assistantClinicSlug}
                    onChange={(e) => {
                        setAssistantClinicSlug(e.target.value);
                        setRecommendedDoctorId(null);
                    }}
                >
                    {clinics.map((clinic) => (
                        <option key={clinic.id} value={clinic.slug}>
                            AI-подбор в клинике: {clinic.name}
                        </option>
                    ))}
                </select>
            </div>

            {assistantClinic && (
                <div className="rounded-2xl border border-border p-4">
                    <SymptomAssistant
                        slug={assistantClinic.slug}
                        doctors={assistantClinic.doctors.map((d) => ({ id: d.id, name: d.name, speciality: d.speciality }))}
                        onRecommend={(doctorId) => {
                            setRecommendedDoctorId(doctorId);
                            setView("doctors");
                            setQuery("");
                        }}
                    />
                </div>
            )}

            <YandexClinicMap clinics={filteredClinics} />

            <div className="inline-flex rounded-xl border border-border p-1 bg-muted/40">
                <button
                    onClick={() => setView("clinics")}
                    className={`px-3 py-1.5 text-sm rounded-lg transition ${
                        view === "clinics" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"
                    }`}
                >
                    По клиникам
                </button>
                <button
                    onClick={() => setView("doctors")}
                    className={`px-3 py-1.5 text-sm rounded-lg transition ${
                        view === "doctors" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"
                    }`}
                >
                    По специалистам
                </button>
            </div>

            {filteredClinics.length === 0 ? (
                <div className="rounded-2xl border border-border p-6 text-muted-foreground">
                    Ничего не найдено. Попробуйте другой запрос.
                </div>
            ) : view === "clinics" ? (
                <div className="grid gap-3">
                    {filteredClinics.map((clinic) => (
                        <div key={clinic.id} className="rounded-2xl border border-border p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="space-y-1">
                                    <p className="font-semibold">{clinic.name}</p>
                                    {clinic.address && <p className="text-sm text-muted-foreground">{clinic.address}</p>}
                                    {clinic.phone && <p className="text-sm text-muted-foreground">{clinic.phone}</p>}
                                    <p className="text-xs text-muted-foreground">
                                        Специалистов для записи: {clinic.doctors.length}
                                    </p>
                                </div>
                                <Link href={`/${clinic.slug}`} className="rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
                                    Записаться
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid gap-3">
                    {doctorsView.map((item) => (
                        <div
                            key={`${item.clinicSlug}-${item.doctor.id}`}
                            className={`rounded-2xl border p-4 ${
                                recommendedDoctorId === item.doctor.id ? "border-violet-400 bg-violet-50/40" : "border-border"
                            }`}
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="font-semibold">{item.doctor.name}</p>
                                    {item.doctor.speciality && (
                                        <p className="text-sm text-muted-foreground">{item.doctor.speciality}</p>
                                    )}
                                    <p className="text-sm text-muted-foreground mt-1">{item.clinicName}</p>
                                </div>
                                <Link href={`/${item.clinicSlug}`} className="rounded-xl border border-border px-3 py-2 text-sm font-medium">
                                    К записи
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
