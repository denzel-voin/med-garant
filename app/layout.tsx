import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

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
  description: "Ваш цифровой администратор",
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html
            lang="ru"
            suppressHydrationWarning
            className={cn(
                geistSans.variable,
                geistMono.variable,
                "h-full scroll-smooth"
            )}
        >
        <body
            className={cn(
                "min-h-screen font-sans antialiased",
                "bg-background text-foreground",
                "selection:bg-primary selection:text-primary-foreground"
            )}
        >
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.04),transparent_60%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_60%)]" />

        <div className="mx-auto max-w-6xl px-6">
            {children}
        </div>
        </body>
        </html>
    );
}