"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2, LogIn, UserPlus } from "lucide-react";

interface PatientMe {
    fullName: string;
    email: string;
}

export default function PatientLayout({ children }: { children: React.ReactNode }) {
    const [me, setMe] = useState<PatientMe | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/v1/patient/me")
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => setMe(data))
            .finally(() => setLoading(false));
    }, []);

    const initials = me
        ? me.fullName
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0])
              .join("")
              .toUpperCase()
        : "";

    async function logout() {
        await fetch("/api/v1/auth/logout", { method: "POST" });
        window.location.href = "/";
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10">
                <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                        <span className="text-xl">🏥</span>
                        <span>МедГарант</span>
                    </Link>

                    <div className="ml-auto flex items-center gap-3">
                        {loading ? (
                            <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        ) : me ? (
                            <>
                                <Link
                                    href="/me"
                                    className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
                                >
                                    <span className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                                        {initials}
                                    </span>
                                    <span className="hidden sm:block font-medium truncate max-w-[160px]">
                                        {me.fullName}
                                    </span>
                                </Link>
                                <button
                                    onClick={logout}
                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Выйти
                                </button>
                            </>
                        ) : (
                            <>
                                <Button asChild variant="ghost" size="sm" className="gap-1.5">
                                    <Link href="/login-patient">
                                        <LogIn className="size-4" />
                                        <span>Войти</span>
                                    </Link>
                                </Button>
                                <Button asChild size="sm" className="gap-1.5">
                                    <Link href="/register-patient">
                                        <UserPlus className="size-4" />
                                        <span className="hidden sm:inline">Зарегистрироваться</span>
                                        <span className="sm:hidden">Регистрация</span>
                                    </Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </header>
            <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
        </div>
    );
}