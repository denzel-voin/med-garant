"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { Loader2 } from "lucide-react";

export default function PatientRegisterPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "", confirm: "" });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (form.password !== form.confirm) {
            toast("Пароли не совпадают", "error");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/v1/auth/register-patient", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullName: form.fullName, email: form.email, phone: form.phone || undefined, password: form.password }),
            });
            const data = await res.json();
            if (!res.ok) {
                const msg = data.error?.code === "EMAIL_TAKEN" ? "Этот email уже зарегистрирован" : data.error?.message ?? "Ошибка регистрации";
                toast(msg, "error");
                return;
            }
            toast(`Добро пожаловать, ${data.user?.fullName ?? ""}!`, "success");
            router.push("/me");
            router.refresh();
        } catch {
            toast("Ошибка сети. Проверьте подключение.", "error");
        } finally {
            setLoading(false);
        }
    }

    const inputCls = "w-full h-11 px-4 rounded-xl bg-[#F5F5F7] text-[#1D1D1F] placeholder:text-[#6E6E73] text-sm border-0 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white transition-all";
    const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((s) => ({ ...s, [key]: e.target.value }));

    return (
        <div className="w-full max-w-sm">
            <div className="bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.10)] p-8">
                <Link href="/" className="flex items-center gap-2 mb-8">
                    <span className="text-2xl">🏥</span>
                    <span className="font-semibold text-[#1D1D1F] text-lg">МедГарант</span>
                </Link>

                <div className="mb-6">
                    <h1 className="text-[26px] font-bold text-[#1D1D1F] tracking-tight leading-tight">
                        Регистрация пациента
                    </h1>
                    <p className="text-[#6E6E73] mt-1.5 text-sm">Создайте аккаунт для отслеживания записей и отзывов</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[#1D1D1F]">ФИО *</label>
                        <input className={inputCls} placeholder="Иванова Мария Петровна" value={form.fullName} onChange={f("fullName")} required minLength={2} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[#1D1D1F]">Email *</label>
                        <input type="email" className={inputCls} placeholder="patient@example.com" autoComplete="email" value={form.email} onChange={f("email")} required />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[#1D1D1F]">
                            Телефон <span className="text-[#6E6E73] font-normal">(необязательно)</span>
                        </label>
                        <input type="tel" className={inputCls} placeholder="+7 (999) 123-45-67" value={form.phone} onChange={f("phone")} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[#1D1D1F]">Пароль *</label>
                        <input type="password" className={inputCls} placeholder="Минимум 8 символов" autoComplete="new-password" value={form.password} onChange={f("password")} required minLength={8} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[#1D1D1F]">Повторите пароль *</label>
                        <input type="password" className={inputCls} placeholder="••••••••" autoComplete="new-password" value={form.confirm} onChange={f("confirm")} required minLength={8} />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-1"
                    >
                        {loading ? <><Loader2 className="size-4 animate-spin" /> Создаём аккаунт...</> : "Зарегистрироваться"}
                    </button>
                </form>

                <p className="mt-5 text-center text-sm text-[#6E6E73]">
                    Уже есть аккаунт?{" "}
                    <Link href="/login-patient" className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
                        Войти
                    </Link>
                </p>
            </div>
        </div>
    );
}
