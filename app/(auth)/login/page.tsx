"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ email: "", password: "" });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/v1/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) {
                toast(data.error?.message ?? "Ошибка входа", "error");
                return;
            }
            router.push("/appointments");
            router.refresh();
        } catch {
            toast("Ошибка сети. Проверьте подключение.", "error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full max-w-sm">
            <div className="bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.10)] p-8">
                <Link href="/" className="flex items-center gap-2 mb-8">
                    <span className="text-2xl">🏥</span>
                    <span className="font-semibold text-[#1D1D1F] text-lg">МедГарант</span>
                </Link>

                <div className="mb-6">
                    <h1 className="text-[26px] font-bold text-[#1D1D1F] tracking-tight leading-tight">
                        Вход в кабинет
                    </h1>
                    <p className="text-[#6E6E73] mt-1.5 text-sm">Введите данные вашей клиники</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[#1D1D1F]" htmlFor="email">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="clinic@example.com"
                            autoComplete="email"
                            value={form.email}
                            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                            required
                            className="w-full h-11 px-4 rounded-xl bg-[#F5F5F7] text-[#1D1D1F] placeholder:text-[#6E6E73] text-sm border-0 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white transition-all"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[#1D1D1F]" htmlFor="password">
                            Пароль
                        </label>
                        <input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            autoComplete="current-password"
                            value={form.password}
                            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                            required
                            className="w-full h-11 px-4 rounded-xl bg-[#F5F5F7] text-[#1D1D1F] placeholder:text-[#6E6E73] text-sm border-0 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-2"
                    >
                        {loading ? <><Loader2 className="size-4 animate-spin" /> Входим...</> : "Войти"}
                    </button>
                </form>

                <p className="mt-5 text-center text-sm text-[#6E6E73]">
                    Нет аккаунта?{" "}
                    <Link href="/register" className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
                        Зарегистрировать клинику
                    </Link>
                </p>
            </div>
        </div>
    );
}