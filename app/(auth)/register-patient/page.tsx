"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Card, CardContent, CardHeader,
    CardTitle, CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

export default function PatientRegisterPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        confirm: "",
    });

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
                body: JSON.stringify({
                    fullName: form.fullName,
                    email: form.email,
                    phone: form.phone || undefined,
                    password: form.password,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                const msg =
                    data.error?.code === "EMAIL_TAKEN"
                        ? "Этот email уже зарегистрирован"
                        : data.error?.message ?? "Ошибка регистрации";
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

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">🏥</span>
                    <span className="font-semibold text-lg">МедГарант</span>
                </div>
                <CardTitle>Регистрация пациента</CardTitle>
                <CardDescription>
                    Создайте аккаунт, чтобы отслеживать записи и оставлять отзывы на врачей
                </CardDescription>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="fullName">ФИО *</Label>
                        <Input
                            id="fullName"
                            placeholder="Иванова Мария Петровна"
                            value={form.fullName}
                            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                            required
                            minLength={2}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="patient@example.com"
                            autoComplete="email"
                            value={form.email}
                            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="phone">
                            Телефон{" "}
                            <span className="text-muted-foreground text-xs font-normal">(необязательно)</span>
                        </Label>
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="+7 (999) 123-45-67"
                            value={form.phone}
                            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="password">Пароль *</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Минимум 8 символов"
                            autoComplete="new-password"
                            value={form.password}
                            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                            required
                            minLength={8}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="confirm">Повторите пароль *</Label>
                        <Input
                            id="confirm"
                            type="password"
                            placeholder="••••••••"
                            autoComplete="new-password"
                            value={form.confirm}
                            onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                            required
                            minLength={8}
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Создаём аккаунт..." : "Зарегистрироваться"}
                    </Button>
                </form>

                <div className="mt-4 text-center text-sm text-muted-foreground">
                    Уже есть аккаунт?{" "}
                    <Link
                        href="/login-patient"
                        className="text-foreground underline underline-offset-4 hover:opacity-80"
                    >
                        Войти
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}