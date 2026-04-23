import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function CancelledPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#FBFBFD]">
            <div className="text-center max-w-sm">
                <div className="size-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="size-10 text-emerald-500" />
                </div>
                <h1 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">Запись отменена</h1>
                <p className="text-[#6E6E73] text-sm mt-3 leading-relaxed">
                    Ваша запись была успешно отменена.<br />
                    Если хотите записаться снова — перейдите на страницу клиники.
                </p>
                <Link
                    href="/"
                    className="mt-8 inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                    На главную
                </Link>
            </div>
        </div>
    );
}