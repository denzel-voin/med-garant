"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

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
        <Card className="w-full max-w-md">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">🏥</span>
                    <span className="font-semibold text-lg">МедГарант</span>
                </div>
                <CardTitle>Вход в кабинет</CardTitle>
                <CardDescription>Введите данные вашей клиники</CardDescription>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="clinic@example.com"
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
                            placeholder="••••••••"
                            autoComplete="current-password"
                            value={form.password}
                            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                            required
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Вход..." : "Войти"}
                    </Button>
                </form>

                <p className="mt-4 text-center text-sm text-muted-foreground">
                    Нет аккаунта?{" "}
                    <Link href="/register" className="text-foreground underline underline-offset-4 hover:opacity-80">
                        Зарегистрировать клинику
                    </Link>
                </p>
            </CardContent>
        </Card>
    );
}