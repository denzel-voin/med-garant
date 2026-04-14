"use client";
import * as React from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextValue {
    toasts: Toast[];
    toast: (message: string, type?: ToastType) => void;
    dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = React.useState<Toast[]>([]);

    const toast = React.useCallback((message: string, type: ToastType = "info") => {
        const id = Math.random().toString(36).slice(2);
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
    }, []);

    const dismiss = React.useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const colorMap: Record<ToastType, string> = {
        success: "bg-emerald-600",
        error: "bg-red-600",
        info: "bg-zinc-800",
    };

    return (
        <ToastContext.Provider value={{ toasts, toast, dismiss }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`${colorMap[t.type]} text-white text-sm px-4 py-3 rounded-xl shadow-lg pointer-events-auto
              flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2`}
                    >
                        <span>{t.message}</span>
                        <button
                            onClick={() => dismiss(t.id)}
                            className="shrink-0 opacity-70 hover:opacity-100 text-lg leading-none"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = React.useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within ToastProvider");
    return ctx;
}