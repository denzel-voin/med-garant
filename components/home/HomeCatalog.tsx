"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { YandexClinicMap } from "@/components/maps/YandexClinicMap";
import {
    Sparkles, AlertTriangle, Search,
    MapPin, Phone, ChevronRight, X, Users,
} from "lucide-react";

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
    logo?: string | null;
    address?: string | null;
    phone?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    doctors: Doctor[];
};

interface AiResult {
    doctorId: string;
    doctorName: string;
    speciality: string | null;
    clinicSlug: string;
    clinicName: string;
    clinicAddress: string | null;
    reasoning: string;
}

interface PatientMe {
    fullName: string;
    email: string;
}

const EMERGENCY_KEYWORDS = [
    "боль в груди", "потеря сознания", "не дышит", "инфаркт", "инсульт",
    "кровотечение не останавливается",
];

function plural(n: number, one: string, few: string, many: string) {
    const mod10 = n % 10, mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 14) return `${n} ${many}`;
    if (mod10 === 1) return `${n} ${one}`;
    if (mod10 >= 2 && mod10 <= 4) return `${n} ${few}`;
    return `${n} ${many}`;
}

export function HomeCatalog({
    initialView,
    clinics,
}: {
    initialView: "clinics" | "doctors";
    clinics: Clinic[];
}) {
    const [view, setView] = useState<"clinics" | "doctors">(initialView);
    const [query, setQuery] = useState("");

    // patient auth
    const [patient, setPatient] = useState<PatientMe | null | undefined>(undefined);
    useEffect(() => {
        fetch("/api/v1/patient/me")
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => setPatient(d))
            .catch(() => setPatient(null));
    }, []);
    const initials = patient
        ? patient.fullName.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
        : "";

    // AI
    const [aiOpen, setAiOpen] = useState(false);
    const [aiQuery, setAiQuery] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResults, setAiResults] = useState<AiResult[] | null>(null);
    const [aiFallback, setAiFallback] = useState(false);
    const [aiEmergency, setAiEmergency] = useState(false);
    const [highlighted, setHighlighted] = useState<Set<string>>(new Set());

    const filteredClinics = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return clinics;
        return clinics.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                (c.address ?? "").toLowerCase().includes(q) ||
                (c.phone ?? "").includes(q) ||
                c.doctors.some(
                    (d) =>
                        d.name.toLowerCase().includes(q) ||
                        (d.speciality ?? "").toLowerCase().includes(q)
                )
        );
    }, [clinics, query]);

    const doctorsView = useMemo(
        () =>
            filteredClinics.flatMap((c) =>
                c.doctors.map((d) => ({ ...d, clinicName: c.name, clinicSlug: c.slug }))
            ),
        [filteredClinics]
    );

    async function doAiSearch() {
        if (aiQuery.trim().length < 3) return;
        if (EMERGENCY_KEYWORDS.some((kw) => aiQuery.toLowerCase().includes(kw))) {
            setAiEmergency(true);
            return;
        }
        setAiLoading(true);
        setAiResults(null);
        setAiFallback(false);
        setAiEmergency(false);
        try {
            const res = await fetch("/api/v1/ai/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: aiQuery }),
            });
            const data = await res.json();
            if (data.usedFallback || !data.results?.length) {
                setAiFallback(true);
                return;
            }
            setAiResults(data.results);
            setHighlighted(new Set(data.results.map((r: AiResult) => r.doctorId)));
            setView("doctors");
            setQuery("");
        } catch {
            setAiFallback(true);
        } finally {
            setAiLoading(false);
        }
    }

    function resetAi() {
        setAiResults(null);
        setAiFallback(false);
        setAiEmergency(false);
        setHighlighted(new Set());
    }

    return (
        <div className="min-h-screen bg-[#FBFBFD]">
            {/* ── Nav ── */}
            <nav className="sticky top-0 z-50 bg-[#FBFBFD]/80 backdrop-blur-xl border-b border-black/[0.06]">
                <div className="mx-auto max-w-5xl px-4 h-14 flex items-center gap-4">
                    <Link
                        href="/"
                        className="flex items-center gap-2 font-semibold text-[15px] tracking-tight text-[#1D1D1F]"
                    >
                        <span className="text-xl">🏥</span>
                        МедГарант
                    </Link>

                    <div className="ml-auto flex items-center gap-2">
                        {patient === undefined ? (
                            <div className="h-4 w-24 rounded-full bg-black/[0.06] animate-pulse" />
                        ) : patient ? (
                            <Link
                                href="/me"
                                className="flex items-center gap-2 rounded-full pl-2 pr-3 py-1.5 hover:bg-black/[0.06] transition-colors"
                            >
                                <span className="size-7 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                                    {initials}
                                </span>
                                <span className="text-sm font-medium text-[#1D1D1F] max-w-[140px] truncate hidden sm:block">
                                    {patient.fullName}
                                </span>
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href="/login-patient"
                                    className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors px-3 py-1.5"
                                >
                                    Войти
                                </Link>
                                <Link
                                    href="/register-patient"
                                    className="text-sm font-medium bg-blue-600 text-white rounded-full px-4 py-1.5 hover:bg-blue-700 transition-colors"
                                >
                                    Регистрация
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section className="mx-auto max-w-2xl px-4 pt-16 pb-12 text-center">
                <h1 className="text-[52px] font-bold tracking-tight text-[#1D1D1F] leading-[1.08] mb-4">
                    Запись к врачу<br />онлайн
                </h1>
                <p className="text-xl text-[#6E6E73] mb-8 leading-relaxed">
                    Найдите нужного специалиста<br className="hidden sm:block" /> и запишитесь за минуту
                </p>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#6E6E73] pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Клиника, врач, специальность или адрес..."
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); resetAi(); }}
                        className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white border border-black/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.06)] text-[#1D1D1F] placeholder:text-[#6E6E73] text-base focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/60 transition-all"
                    />
                </div>
            </section>

            {/* ── Content ── */}
            <div className="mx-auto max-w-5xl px-4 pb-16 space-y-5">

                {/* AI block */}
                <div className="rounded-2xl border border-black/[0.06] bg-white shadow-sm overflow-hidden">
                    {!aiOpen ? (
                        <button
                            onClick={() => setAiOpen(true)}
                            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[#F5F5F7] transition-colors text-left"
                        >
                            <span className="size-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shrink-0 shadow-sm">
                                <Sparkles className="size-4 text-white" />
                            </span>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-[#1D1D1F]">AI‑помощник</p>
                                <p className="text-xs text-[#6E6E73]">
                                    Опишите симптомы — AI подберёт специалиста по всем клиникам
                                </p>
                            </div>
                            <ChevronRight className="size-4 text-[#6E6E73] ml-auto shrink-0" />
                        </button>
                    ) : (
                        <div className="p-5 space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="size-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shrink-0 shadow-sm">
                                    <Sparkles className="size-4 text-white" />
                                </span>
                                <div>
                                    <p className="text-sm font-semibold text-[#1D1D1F]">AI‑помощник</p>
                                    <p className="text-xs text-[#6E6E73]">Поиск по всем клиникам и специалистам</p>
                                </div>
                                <button
                                    onClick={() => { setAiOpen(false); resetAi(); }}
                                    className="ml-auto size-7 flex items-center justify-center rounded-full hover:bg-[#F5F5F7] transition-colors"
                                >
                                    <X className="size-4 text-[#6E6E73]" />
                                </button>
                            </div>

                            <textarea
                                placeholder='Например: «ноет зуб справа», «нужен массаж утром в будни», «хочу к кардиологу рядом с центром»...'
                                value={aiQuery}
                                onChange={(e) => setAiQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) doAiSearch();
                                }}
                                className="w-full rounded-xl bg-[#F5F5F7] border-0 px-4 py-3 text-sm text-[#1D1D1F] placeholder:text-[#6E6E73] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                                rows={3}
                                maxLength={1000}
                            />

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={doAiSearch}
                                    disabled={aiLoading || aiQuery.trim().length < 3}
                                    className="px-5 py-2 rounded-full bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                    {aiLoading ? "Ищу..." : "Подобрать"}
                                </button>
                                <span className="text-xs text-[#6E6E73]">Ctrl+Enter</span>
                            </div>

                            {aiEmergency && (
                                <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-100 p-4">
                                    <AlertTriangle className="size-4 text-red-500 mt-0.5 shrink-0" />
                                    <div className="text-sm">
                                        <p className="font-semibold text-red-700">Экстренная ситуация</p>
                                        <p className="text-red-600 mt-0.5">Немедленно позвоните в скорую: <strong>103</strong></p>
                                    </div>
                                </div>
                            )}

                            {aiFallback && !aiEmergency && (
                                <p className="text-sm text-[#6E6E73]">
                                    AI временно недоступен. Воспользуйтесь поиском ниже.
                                </p>
                            )}

                            {aiResults && aiResults.length > 0 && (
                                <div className="space-y-2.5 pt-1">
                                    <p className="text-xs font-semibold text-violet-600 uppercase tracking-wide">
                                        {plural(aiResults.length, "специалист", "специалиста", "специалистов")} подобрано
                                    </p>
                                    {aiResults.map((r) => (
                                        <Link
                                            key={r.doctorId}
                                            href={`/${r.clinicSlug}`}
                                            className="flex items-start justify-between gap-3 rounded-xl bg-[#F5F5F7] hover:bg-[#EBEBEB] p-4 transition-colors group"
                                        >
                                            <div className="min-w-0 space-y-0.5">
                                                <p className="text-sm font-semibold text-[#1D1D1F] truncate">
                                                    {r.doctorName}
                                                </p>
                                                {r.speciality && (
                                                    <p className="text-xs text-[#6E6E73]">{r.speciality}</p>
                                                )}
                                                <p className="text-xs text-[#6E6E73]">
                                                    {r.clinicName}
                                                    {r.clinicAddress ? ` · ${r.clinicAddress}` : ""}
                                                </p>
                                                <p className="text-xs text-[#6E6E73] italic mt-1">{r.reasoning}</p>
                                            </div>
                                            <ChevronRight className="size-4 text-[#6E6E73] shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                                        </Link>
                                    ))}
                                    <p className="text-xs text-[#6E6E73] italic">
                                        ⚠ Информационная рекомендация, не медицинское заключение.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Map */}
                <YandexClinicMap clinics={filteredClinics} />

                {/* Tabs + count */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-0.5 bg-[#F5F5F7] rounded-xl p-1">
                        {(["clinics", "doctors"] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setView(t)}
                                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                                    view === t
                                        ? "bg-white shadow-sm text-[#1D1D1F]"
                                        : "text-[#6E6E73] hover:text-[#1D1D1F]"
                                }`}
                            >
                                {t === "clinics" ? "Клиники" : "Специалисты"}
                            </button>
                        ))}
                    </div>
                    <span className="text-sm text-[#6E6E73]">
                        {view === "clinics"
                            ? plural(filteredClinics.length, "клиника", "клиники", "клиник")
                            : plural(doctorsView.length, "специалист", "специалиста", "специалистов")}
                    </span>
                </div>

                {/* Cards grid */}
                {filteredClinics.length === 0 ? (
                    <div className="rounded-2xl bg-white border border-black/[0.06] p-12 text-center">
                        <Search className="size-8 mx-auto mb-3 text-[#6E6E73] opacity-40" />
                        <p className="text-sm text-[#6E6E73]">Ничего не найдено. Попробуйте другой запрос.</p>
                    </div>
                ) : view === "clinics" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {filteredClinics.map((clinic) => (
                            <Link
                                key={clinic.id}
                                href={`/${clinic.slug}`}
                                className="group flex items-start gap-4 rounded-2xl bg-white border border-black/[0.06] p-4 shadow-sm hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200"
                            >
                                {clinic.logo ? (
                                    <img
                                        src={clinic.logo}
                                        alt={clinic.name}
                                        className="size-12 rounded-xl object-cover shrink-0"
                                    />
                                ) : (
                                    <div className="size-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl shrink-0">
                                        🏥
                                    </div>
                                )}
                                <div className="min-w-0 flex-1 space-y-1">
                                    <p className="font-semibold text-[#1D1D1F] group-hover:text-blue-600 transition-colors leading-tight">
                                        {clinic.name}
                                    </p>
                                    {clinic.address && (
                                        <p className="text-xs text-[#6E6E73] flex items-center gap-1">
                                            <MapPin className="size-3 shrink-0" />
                                            {clinic.address}
                                        </p>
                                    )}
                                    {clinic.phone && (
                                        <p className="text-xs text-[#6E6E73] flex items-center gap-1">
                                            <Phone className="size-3 shrink-0" />
                                            {clinic.phone}
                                        </p>
                                    )}
                                    <p className="text-xs text-[#6E6E73] flex items-center gap-1">
                                        <Users className="size-3 shrink-0" />
                                        {plural(clinic.doctors.length, "специалист", "специалиста", "специалистов")}
                                    </p>
                                </div>
                                <ChevronRight className="size-4 text-[#6E6E73] shrink-0 mt-1 group-hover:translate-x-0.5 group-hover:text-blue-600 transition-all" />
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {doctorsView.map((item) => (
                            <Link
                                key={`${item.clinicSlug}-${item.id}`}
                                href={`/${item.clinicSlug}`}
                                className={`group flex items-start gap-4 rounded-2xl border p-4 shadow-sm hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200 ${
                                    highlighted.has(item.id)
                                        ? "bg-violet-50 border-violet-200"
                                        : "bg-white border-black/[0.06]"
                                }`}
                            >
                                <div className="size-12 rounded-xl bg-[#F5F5F7] flex items-center justify-center text-2xl shrink-0">
                                    👤
                                </div>
                                <div className="min-w-0 flex-1 space-y-0.5">
                                    <p className="font-semibold text-[#1D1D1F] group-hover:text-blue-600 transition-colors leading-tight truncate">
                                        {item.name}
                                    </p>
                                    {item.speciality && (
                                        <p className="text-xs text-[#6E6E73]">{item.speciality}</p>
                                    )}
                                    <p className="text-xs text-[#6E6E73]">{item.clinicName}</p>
                                </div>
                                <ChevronRight className="size-4 text-[#6E6E73] shrink-0 mt-1 group-hover:translate-x-0.5 group-hover:text-blue-600 transition-all" />
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Footer ── */}
            <footer className="border-t border-black/[0.06] py-6">
                <div className="mx-auto max-w-5xl px-4 flex items-center justify-between text-sm text-[#6E6E73]">
                    <p>© {new Date().getFullYear()} МедГарант</p>
                    <Link href="/login" className="hover:text-[#1D1D1F] transition-colors">
                        Для клиник
                    </Link>
                </div>
            </footer>
        </div>
    );
}
