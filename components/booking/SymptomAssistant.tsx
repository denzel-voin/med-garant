"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, AlertTriangle } from "lucide-react";

interface Doctor {
    id: string;
    name: string;
    speciality?: string | null;
}

interface Props {
    slug: string;
    doctors: Doctor[];
    onRecommend: (doctorId: string) => void;
}

const EMERGENCY_KEYWORDS = [
    "боль в груди", "chest pain", "потеря сознания", "не дышит",
    "не дышу", "затрудненное дыхание", "инфаркт", "инсульт",
    "потерял сознание", "кровотечение не останавливается",
];

export function SymptomAssistant({ slug, doctors, onRecommend }: Props) {
    const [symptoms, setSymptoms] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ specialistName: string; reasoning: string } | null>(null);
    const [fallback, setFallback] = useState(false);
    const [emergency, setEmergency] = useState(false);
    const [expanded, setExpanded] = useState(false);

    async function handleAsk() {
        if (symptoms.trim().length < 5) return;

        const lower = symptoms.toLowerCase();
        if (EMERGENCY_KEYWORDS.some((kw) => lower.includes(kw))) {
            setEmergency(true);
            return;
        }

        setLoading(true);
        setResult(null);
        setFallback(false);
        setEmergency(false);

        try {
            const res = await fetch("/api/v1/ai/recommend", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tenantSlug: slug, symptoms }),
            });
            const data = await res.json();

            if (data.usedFallback || !data.recommendation) {
                setFallback(true);
                return;
            }

            setResult(data.recommendation);
            onRecommend(data.recommendation.specialistId);
        } catch {
            setFallback(true);
        } finally {
            setLoading(false);
        }
    }

    if (!expanded) {
        return (
            <button
                onClick={() => setExpanded(true)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <Sparkles className="size-4 text-violet-500" />
                Не знаете к кому записаться? AI поможет выбрать
            </button>
        );
    }

    return (
        <div className="rounded-2xl border border-violet-200 bg-violet-50/50 dark:border-violet-900/40 dark:bg-violet-950/20 p-4 space-y-3">
            <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-violet-500" />
                <span className="text-sm font-medium">AI-ассистент выбора специалиста</span>
                <button
                    onClick={() => setExpanded(false)}
                    className="ml-auto text-muted-foreground hover:text-foreground text-lg leading-none"
                >
                    ×
                </button>
            </div>

            <Textarea
                placeholder="Опишите жалобы: например, «ноет зуб», «тревога и стресс», «хочу убрать морщины»..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="bg-white dark:bg-zinc-900 text-sm"
                rows={3}
                maxLength={1000}
            />

            <Button
                onClick={handleAsk}
                disabled={loading || symptoms.trim().length < 5}
                size="sm"
                className="bg-violet-600 hover:bg-violet-700 text-white"
            >
                {loading ? "Анализирую..." : "Подобрать специалиста"}
            </Button>

            {emergency && (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                    <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-medium">Экстренная ситуация</p>
                        <p>Немедленно позвоните в скорую помощь: <strong>103</strong></p>
                    </div>
                </div>
            )}

            {fallback && !emergency && (
                <p className="text-sm text-muted-foreground">
                    AI-ассистент временно недоступен. Пожалуйста, выберите специалиста из списка ниже.
                </p>
            )}

            {result && (
                <div className="rounded-xl bg-white dark:bg-zinc-900 border border-violet-200 dark:border-violet-800 p-3 space-y-1">
                    <p className="text-sm font-medium text-violet-700 dark:text-violet-400">
                        Рекомендуем: {result.specialistName}
                    </p>
                    <p className="text-xs text-muted-foreground">{result.reasoning}</p>
                    <p className="text-xs text-muted-foreground italic mt-1">
                        ⚠️ Это информационная рекомендация, не медицинское заключение.
                    </p>
                </div>
            )}
        </div>
    );
}