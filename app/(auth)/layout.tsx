import React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(0,0,0,0.04),transparent_60%)]" />
            {children}
        </div>
    );
}