"use client";

import { usePathname, useRouter } from "next/navigation";
import { Menu, LogOut, X, Calendar, Users, Briefcase, BarChart2, Settings, Activity } from "lucide-react";
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
            <header className="border-b border-black/[0.06] bg-white/80 backdrop-blur-xl px-4 md:px-6 py-3 flex items-center gap-3 shrink-0">
                <button
                    className="md:hidden p-1.5 rounded-lg hover:bg-black/[0.04] transition-colors"
                    onClick={() => setMobileOpen(true)}
                >
                    <Menu className="size-5 text-[#1D1D1F]" />
                </button>
                <h1 className="font-semibold text-[15px] text-[#1D1D1F]">{title}</h1>
            </header>

            {mobileOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
                    <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-[4px_0_24px_rgba(0,0,0,0.08)] flex flex-col">
                        <div className="px-5 py-5 border-b border-black/[0.06] flex items-center gap-2">
                            <span className="text-xl">🏥</span>
                            <span className="font-semibold text-[#1D1D1F]">МедГарант</span>
                            <button
                                className="ml-auto size-7 flex items-center justify-center rounded-full hover:bg-black/[0.04] transition-colors"
                                onClick={() => setMobileOpen(false)}
                            >
                                <X className="size-4 text-[#6E6E73]" />
                            </button>
                        </div>
                        <nav className="flex-1 py-3 px-3 space-y-0.5">
                            {NAV.map(({ href, label, icon: Icon }) => {
                                const active = pathname.startsWith(href);
                                return (
                                    <Link
                                        key={href}
                                        href={href}
                                        onClick={() => setMobileOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                                            active
                                                ? "bg-blue-600/[0.08] text-blue-600"
                                                : "text-[#6E6E73] hover:bg-black/[0.04] hover:text-[#1D1D1F]"
                                        )}
                                    >
                                        <Icon className="size-4" />
                                        {label}
                                    </Link>
                                );
                            })}
                        </nav>
                        <div className="p-3 border-t border-black/[0.06]">
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-[#6E6E73] hover:bg-black/[0.04] hover:text-[#1D1D1F] transition-all"
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