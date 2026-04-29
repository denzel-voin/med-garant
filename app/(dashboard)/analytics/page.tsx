"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
    Loader2, TrendingUp, CheckCircle2, XCircle,
    Clock, Banknote, ReceiptText, AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Analytics {
    summary: {
        total: number;
        pending: number;
        confirmed: number;
        completed: number;
        cancelled: number;
        noShow: number;
        noShowRate: number;
        revenue: number;
        avgCheck: number;
    };
    bookingsByDay: { date: string; count: number }[];
    topServices: { name: string; count: number }[];
    doctorWorkload: { name: string; bookings: number; capacityPct: number }[];
}

const PERIOD_OPTIONS = [
    { label: "Эта неделя", value: "week" },
    { label: "Этот месяц", value: "month" },
    { label: "Квартал", value: "quarter" },
];

const SERVICE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

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

function fmt(n: number) {
    return n.toLocaleString("ru-RU");
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

    const maxCount = data ? Math.max(...data.bookingsByDay.map((d) => d.count), 1) : 1;
    const maxService = data?.topServices[0]?.count ?? 1;

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Period tabs */}
            <div className="flex items-center gap-1 bg-[#F5F5F7] rounded-xl p-1 self-start w-fit">
                {PERIOD_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => setPeriod(opt.value)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            period === opt.value
                                ? "bg-white shadow-sm text-[#1D1D1F]"
                                : "text-[#6E6E73] hover:text-[#1D1D1F]"
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
                    {/* KPI row 1: counts */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <KpiCard
                            icon={<TrendingUp className="size-5 text-indigo-500" />}
                            label="Всего записей"
                            value={fmt(data.summary.total)}
                            bg="bg-indigo-50 dark:bg-indigo-950/30"
                        />
                        <KpiCard
                            icon={<Clock className="size-5 text-amber-500" />}
                            label="Ожидает"
                            value={fmt(data.summary.pending + data.summary.confirmed)}
                            bg="bg-amber-50 dark:bg-amber-950/30"
                        />
                        <KpiCard
                            icon={<CheckCircle2 className="size-5 text-emerald-500" />}
                            label="Завершено"
                            value={fmt(data.summary.completed)}
                            bg="bg-emerald-50 dark:bg-emerald-950/30"
                        />
                        <KpiCard
                            icon={<XCircle className="size-5 text-red-500" />}
                            label="Отменено / не явился"
                            value={`${fmt(data.summary.cancelled + data.summary.noShow)}`}
                            sub={data.summary.noShowRate > 0 ? `Неявка ${data.summary.noShowRate}%` : undefined}
                            bg="bg-red-50 dark:bg-red-950/30"
                        />
                    </div>

                    {/* KPI row 2: money */}
                    <div className="grid grid-cols-2 gap-3">
                        <KpiCard
                            icon={<Banknote className="size-5 text-teal-500" />}
                            label="Выручка (завершённые)"
                            value={`${fmt(data.summary.revenue)} ₽`}
                            bg="bg-teal-50 dark:bg-teal-950/30"
                            large
                        />
                        <KpiCard
                            icon={<ReceiptText className="size-5 text-violet-500" />}
                            label="Средний чек"
                            value={data.summary.avgCheck > 0 ? `${fmt(data.summary.avgCheck)} ₽` : "—"}
                            bg="bg-violet-50 dark:bg-violet-950/30"
                            large
                        />
                    </div>

                    {/* Bookings by day */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Записи по дням</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {data.bookingsByDay.every((d) => d.count === 0) ? (
                                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                                    <AlertCircle className="size-8 opacity-30" />
                                    <p className="text-sm">Нет данных за выбранный период</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={240}>
                                    <AreaChart data={data.bookingsByDay} margin={{ left: -20, right: 10, top: 4 }}>
                                        <defs>
                                            <linearGradient id="bookingsGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.18} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
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
                                            domain={[0, maxCount + 1]}
                                        />
                                        <Tooltip
                                            cursor={{ stroke: "#6366f1", strokeWidth: 1, strokeDasharray: "4 2" }}
                                            contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 13 }}
                                            formatter={(v) => [v, "Записей"]}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="count"
                                            name="Записей"
                                            stroke="#6366f1"
                                            strokeWidth={2}
                                            fill="url(#bookingsGrad)"
                                            dot={false}
                                            activeDot={{ r: 4 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Top services — ranked list */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Популярные услуги</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {data.topServices.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-6">Нет данных</p>
                                ) : (
                                    <div className="space-y-3">
                                        {data.topServices.map((svc, i) => (
                                            <div key={svc.name}>
                                                <div className="flex items-center justify-between text-sm mb-1 gap-2">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span
                                                            className="size-2.5 rounded-full shrink-0"
                                                            style={{ background: SERVICE_COLORS[i % SERVICE_COLORS.length] }}
                                                        />
                                                        <span className="truncate font-medium">{svc.name}</span>
                                                    </div>
                                                    <span className="text-muted-foreground shrink-0">{svc.count} зап.</span>
                                                </div>
                                                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all"
                                                        style={{
                                                            width: `${Math.round((svc.count / maxService) * 100)}%`,
                                                            background: SERVICE_COLORS[i % SERVICE_COLORS.length],
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
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
                                                <div className="flex justify-between text-sm mb-1 gap-2">
                                                    <span className="truncate font-medium">{doc.name}</span>
                                                    <span className="text-muted-foreground shrink-0 ml-2">
                                                        {doc.bookings} зап. · {doc.capacityPct}%
                                                    </span>
                                                </div>
                                                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
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
    icon, label, value, bg, sub, large,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    bg: string;
    sub?: string;
    large?: boolean;
}) {
    return (
        <div className={`${bg} rounded-2xl p-4 space-y-1.5`}>
            <div className="flex items-center gap-2">
                {icon}
                <p className="text-xs text-muted-foreground leading-tight">{label}</p>
            </div>
            <p className={`font-bold ${large ? "text-3xl" : "text-2xl"}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
    );
}
