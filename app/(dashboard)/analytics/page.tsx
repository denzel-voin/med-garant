"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from "recharts";
import { Loader2, TrendingUp, Users, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Analytics {
    summary: {
        total: number;
        confirmed: number;
        completed: number;
        cancelled: number;
        noShow: number;
        noShowRate: number;
    };
    bookingsByDay: { date: string; count: number }[];
    topServices: { name: string; count: number }[];
    doctorWorkload: { name: string; bookings: number; capacityPct: number }[];
}

const PERIOD_OPTIONS = [
    { label: "Этот месяц", value: "month" },
    { label: "Эта неделя", value: "week" },
    { label: "Квартал", value: "quarter" },
];

const PIE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function getPeriodDates(period: string): { from: Date; to: Date } {
    const now = new Date();
    if (period === "week") {
        const mon = new Date(now);
        mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
        mon.setHours(0, 0, 0, 0);
        const sun = new Date(mon);
        sun.setDate(mon.getDate() + 6);
        sun.setHours(23, 59, 59, 999);
        return { from: mon, to: sun };
    }
    if (period === "quarter") {
        const q = Math.floor(now.getMonth() / 3);
        const from = new Date(now.getFullYear(), q * 3, 1);
        const to = new Date(now.getFullYear(), q * 3 + 3, 0, 23, 59, 59);
        return { from, to };
    }
    return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
    };
}

export default function AnalyticsPage() {
    const [period, setPeriod] = useState("month");
    const [data, setData] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        try {
            const { from, to } = getPeriodDates(period);
            const params = new URLSearchParams({
                from: from.toISOString(),
                to: to.toISOString(),
            });
            const res = await fetch(`/api/v1/analytics?${params}`);
            if (res.ok) setData(await res.json());
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="flex items-center gap-2">
                {PERIOD_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => setPeriod(opt.value)}
                        className={`px-4 py-1.5 rounded-xl text-sm font-medium border transition-all ${
                            period === opt.value
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
            ) : !data ? (
                <p className="text-muted-foreground">Нет данных</p>
            ) : (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <KpiCard
                            icon={<TrendingUp className="size-5 text-indigo-500" />}
                            label="Всего записей"
                            value={data.summary.total}
                            bg="bg-indigo-50 dark:bg-indigo-950/30"
                        />
                        <KpiCard
                            icon={<CheckCircle2 className="size-5 text-emerald-500" />}
                            label="Завершено"
                            value={data.summary.completed}
                            bg="bg-emerald-50 dark:bg-emerald-950/30"
                        />
                        <KpiCard
                            icon={<XCircle className="size-5 text-red-500" />}
                            label="Не явился, %"
                            value={`${data.summary.noShowRate}%`}
                            bg="bg-red-50 dark:bg-red-950/30"
                        />
                        <KpiCard
                            icon={<Users className="size-5 text-violet-500" />}
                            label="Отменено"
                            value={data.summary.cancelled}
                            bg="bg-violet-50 dark:bg-violet-950/30"
                        />
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Записи по дням</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {data.bookingsByDay.every((d) => d.count === 0) ? (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    Нет данных за выбранный период
                                </p>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={data.bookingsByDay} margin={{ left: -20, right: 10 }}>
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 11 }}
                                            tickLine={false}
                                            axisLine={false}
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis
                                            tick={{ fontSize: 11 }}
                                            tickLine={false}
                                            axisLine={false}
                                            allowDecimals={false}
                                        />
                                        <Tooltip
                                            cursor={{ fill: "rgba(0,0,0,0.04)" }}
                                            contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 13 }}
                                        />
                                        <Bar dataKey="count" name="Записей" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Top services */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Популярные услуги</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {data.topServices.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-6">Нет данных</p>
                                ) : (
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie
                                                data={data.topServices}
                                                dataKey="count"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={70}
                                                label={({ name, percent }) =>
                                                    `${name.length > 12 ? name.slice(0, 12) + "…" : name} ${Math.round(percent * 100)}%`
                                                }
                                                labelLine={false}
                                            >
                                                {data.topServices.map((_, i) => (
                                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 13 }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>

                        {/* Doctor workload */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Загруженность специалистов</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {data.doctorWorkload.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-6">Нет данных</p>
                                ) : (
                                    <div className="space-y-3">
                                        {data.doctorWorkload.map((doc) => (
                                            <div key={doc.name}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="truncate font-medium">{doc.name}</span>
                                                    <span className="text-muted-foreground shrink-0 ml-2">
                            {doc.bookings} зап. · {doc.capacityPct}%
                          </span>
                                                </div>
                                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-indigo-500 transition-all"
                                                        style={{ width: `${doc.capacityPct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}

function KpiCard({
                     icon, label, value, bg,
                 }: {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    bg: string;
}) {
    return (
        <div className={`${bg} rounded-2xl p-4 space-y-2`}>
            <div className="flex items-center justify-between">
                {icon}
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
        </div>
    );
}