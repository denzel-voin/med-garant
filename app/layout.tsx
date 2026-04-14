import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ToastProvider } from "@/components/ui/toast";

const geistSans = Geist({
    variable: "--font-sans",
    subsets: ["latin"],
    display: "swap",
});

const geistMono = Geist_Mono({
    variable: "--font-mono",
    subsets: ["latin"],
    display: "swap",
});

export const metadata: Metadata = {
    title: "МедГарант",
    description: "Цифровой администратор для медицинских сервисов",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html
            lang="ru"
            suppressHydrationWarning
            className={cn(geistSans.variable, geistMono.variable, "h-full scroll-smooth")}
        >
        <body
            className="min-h-screen font-sans antialiased bg-background text-foreground"
        >
        <ToastProvider>{children}</ToastProvider>
        </body>
        </html>
    );
}