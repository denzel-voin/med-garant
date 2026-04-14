"use client";

import { usePathname, useRouter } from "next/navigation";
import { Menu, LogOut, Calendar, Users, Briefcase, BarChart2, Settings, Activity } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const PAGE_TITLES: Record<string, string> = {
    "/appointments": "Записи",
    "/doctors": "Специалисты",
    "/services": "Услуги",
    "/patients": "Пациенты",
    "/analytics": "Аналитика",
    "/settings": "Настройки",
};

const NAV = [
    { href: "/appointments", label: "Записи", icon: Calendar },
    { href: "/doctors", label: "Специалисты", icon: Users },
    { href: "/services", label: "Услуги", icon: Briefcase },
    { href: "/patients", label: "Пациенты", icon: Activity },
    { href: "/analytics", label: "Аналитика", icon: BarChart2 },
    { href: "/settings", label: "Настройки", icon: Settings },
];

export function DashboardHeader() {
    const pathname = usePathname();
    const router = useRouter();
    const [mobileOpen, setMobileOpen] = useState(false);

    const title = Object.entries(PAGE_TITLES).find(([k]) => pathname.startsWith(k))?.[1] ?? "МедГарант";

    async function handleLogout() {
        await fetch("/api/v1/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
    }

    return (
        <>
            <header className="border-b border-border bg-card px-4 md:px-6 py-3 flex items-center gap-3 shrink-0">
                <button
                    className="md:hidden p-1.5 rounded-lg hover:bg-muted"
                    onClick={() => setMobileOpen(true)}
                >
                    <Menu className="size-5" />
                </button>
                <h1 className="font-semibold text-base">{title}</h1>
            </header>

            {/* Mobile drawer */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
                    <aside className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex flex-col">
                        <div className="px-5 py-5 border-b border-border flex items-center gap-2">
                            <span className="text-xl">🏥</span>
                            <span className="font-semibold">МедГарант</span>
                            <button className="ml-auto text-muted-foreground" onClick={() => setMobileOpen(false)}>✕</button>
                        </div>
                        <nav className="flex-1 py-4 px-3 space-y-0.5">
                            {NAV.map(({ href, label, icon: Icon }) => {
                                const active = pathname.startsWith(href);
                                return (
                                    <Link
                                        key={href}
                                        href={href}
                                        onClick={() => setMobileOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                                            active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        )}
                                    >
                                        <Icon className="size-4" />
                                        {label}
                                    </Link>
                                );
                            })}
                        </nav>
                        <div className="p-3 border-t border-border">
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted"
                            >
                                <LogOut className="size-4" /> Выйти
                            </button>
                        </div>
                    </aside>
                </div>
            )}
        </>
    );
}