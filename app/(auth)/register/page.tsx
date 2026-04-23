"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ clinicName: "", slug: "", email: "", password: "" });

    function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
        const name = e.target.value;
        const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 40);
        setForm((f) => ({ ...f, clinicName: name, slug }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/v1/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) {
                const msg =
                    data.error?.code === "SLUG_TAKEN" ? "Этот адрес уже занят, попробуйте другой"
                    : data.error?.code === "EMAIL_TAKEN" ? "Email уже зарегистрирован"
                    : data.error?.message ?? "Ошибка регистрации";
                toast(msg, "error");
                return;
            }
            toast("Клиника зарегистрирована! Добро пожаловать.", "success");
            router.push("/appointments");
            router.refresh();
        } catch {
            toast("Ошибка сети. Проверьте подключение.", "error");
        } finally {
            setLoading(false);
        }
    }

    const inputCls = "w-full h-11 px-4 rounded-xl bg-[#F5F5F7] text-[#1D1D1F] placeholder:text-[#6E6E73] text-sm border-0 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white transition-all";

    return (
        <div className="w-full max-w-sm">
            <div className="bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.10)] p-8">
                <Link href="/" className="flex items-center gap-2 mb-8">
                    <span className="text-2xl">🏥</span>
                    <span className="font-semibold text-[#1D1D1F] text-lg">МедГарант</span>
                </Link>

                <div className="mb-6">
                    <h1 className="text-[26px] font-bold text-[#1D1D1F] tracking-tight leading-tight">
                        Регистрация клиники
                    </h1>
                    <p className="text-[#6E6E73] mt-1.5 text-sm">Настройка займёт меньше 2 минут</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[#1D1D1F]">Название клиники</label>
                        <input className={inputCls} placeholder="Клиника Здоровье" value={form.clinicName} onChange={handleNameChange} required />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[#1D1D1F]">
                            Адрес страницы{" "}
                            <span className="text-[#6E6E73] font-normal">(a–z, 0–9, дефис)</span>
                        </label>
                        <div className="flex items-center rounded-xl bg-[#F5F5F7] overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:bg-white transition-all">
                            <span className="px-3 text-sm text-[#6E6E73] shrink-0 select-none">medgarant.ru/</span>
                            <input
                                className="flex-1 h-11 pr-4 text-sm text-[#1D1D1F] bg-transparent border-0 focus:outline-none"
                                placeholder="klinika-zdorovie"
                                value={form.slug}
                                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                                minLength={3}
                                maxLength={50}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[#1D1D1F]">Email</label>
                        <input id="email" type="email" className={inputCls} placeholder="admin@clinic.ru" autoComplete="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[#1D1D1F]">Пароль</label>
                        <input id="password" type="password" className={inputCls} placeholder="Минимум 8 символов" autoComplete="new-password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} minLength={8} required />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-2"
                    >
                        {loading ? <><Loader2 className="size-4 animate-spin" /> Создаём аккаунт...</> : "Зарегистрироваться"}
                    </button>
                </form>

                <p className="mt-5 text-center text-sm text-[#6E6E73]">
                    Уже есть аккаунт?{" "}
                    <Link href="/login" className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
                        Войти
                    </Link>
                </p>
            </div>
        </div>
    );
}
