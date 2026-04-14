"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

export default function RegisterPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        clinicName: "",
        slug: "",
        email: "",
        password: "",
    });

    // Auto-generate slug from clinic name
    function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
        const name = e.target.value;
        const slug = name
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")
            .slice(0, 40);
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
                    data.error?.code === "SLUG_TAKEN"
                        ? "Этот адрес уже занят, попробуйте другой"
                        : data.error?.code === "EMAIL_TAKEN"
                            ? "Email уже зарегистрирован"
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

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">🏥</span>
                    <span className="font-semibold text-lg">МедГарант</span>
                </div>
                <CardTitle>Регистрация клиники</CardTitle>
                <CardDescription>Настройка займёт меньше 2 минут</CardDescription>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="clinicName">Название клиники</Label>
                        <Input
                            id="clinicName"
                            placeholder="Клиника Здоровье"
                            value={form.clinicName}
                            onChange={handleNameChange}
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="slug">
                            Адрес страницы{" "}
                            <span className="text-muted-foreground text-xs font-normal">
                (только a–z, 0–9, дефис)
              </span>
                        </Label>
                        <div className="flex items-center rounded-xl border border-border overflow-hidden focus-within:ring-2 focus-within:ring-ring/50">
              <span className="px-3 text-sm text-muted-foreground bg-muted border-r border-border py-2 select-none">
                medgarant.ru/
              </span>
                            <input
                                id="slug"
                                className="flex-1 px-3 py-2 text-sm bg-background outline-none"
                                placeholder="klinika-zdorovie"
                                value={form.slug}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                                    }))
                                }
                                minLength={3}
                                maxLength={50}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="admin@clinic.ru"
                            autoComplete="email"
                            value={form.email}
                            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="password">Пароль</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Минимум 8 символов"
                            autoComplete="new-password"
                            value={form.password}
                            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                            minLength={8}
                            required
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Создаём аккаунт..." : "Зарегистрироваться"}
                    </Button>
                </form>

                <p className="mt-4 text-center text-sm text-muted-foreground">
                    Уже есть аккаунт?{" "}
                    <Link href="/login" className="text-foreground underline underline-offset-4 hover:opacity-80">
                        Войти
                    </Link>
                </p>
            </CardContent>
        </Card>
    );
}