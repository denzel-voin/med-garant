"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, Users, Briefcase, BarChart2, Settings, LogOut, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
    { href: "/appointments", label: "Записи", icon: Calendar },
    { href: "/doctors", label: "Специалисты", icon: Users },
    { href: "/services", label: "Услуги", icon: Briefcase },
    { href: "/patients", label: "Пациенты", icon: Activity },
    { href: "/analytics", label: "Аналитика", icon: BarChart2 },
    { href: "/settings", label: "Настройки", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    async function handleLogout() {
        await fetch("/api/v1/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
    }

    return (
        <aside className="w-56 shrink-0 border-r border-black/[0.06] bg-white flex flex-col h-full hidden md:flex">
            <div className="px-5 py-5 border-b border-black/[0.06]">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🏥</span>
                    <span className="font-semibold text-[#1D1D1F] text-[15px]">МедГарант</span>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
                {NAV.map(({ href, label, icon: Icon }) => {
                    const active = pathname.startsWith(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                                active
                                    ? "bg-blue-600/[0.08] text-blue-600"
                                    : "text-[#6E6E73] hover:bg-black/[0.04] hover:text-[#1D1D1F]"
                            )}
                        >
                            <Icon className="size-4 shrink-0" />
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
                    <LogOut className="size-4" />
                    Выйти
                </button>
            </div>
        </aside>
    );
}