"use client";

import React from "react";
import Link from "next/link";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10">
                <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                        <span className="text-xl">🏥</span>
                        <span>МедГарант</span>
                    </Link>
                    <div className="ml-auto flex items-center gap-3">
                        <Link
                            href="/me"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Мои записи
                        </Link>
                        <form action="/api/v1/auth/logout" method="POST">
                            <button
                                type="submit"
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                onClick={async (e) => {
                                    e.preventDefault();
                                    await fetch("/api/v1/auth/logout", { method: "POST" });
                                    window.location.href = "/";
                                }}
                            >
                                Выйти
                            </button>
                        </form>
                    </div>
                </div>
            </header>
            <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
        </div>
    );
}