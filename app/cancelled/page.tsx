import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function CancelledPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="text-center max-w-sm">
                <CheckCircle className="size-14 text-muted-foreground mx-auto mb-4" />
                <h1 className="text-xl font-semibold">Запись отменена</h1>
                <p className="text-muted-foreground text-sm mt-2">
                    Ваша запись была успешно отменена. Если вы хотите записаться снова — перейдите на страницу клиники.
                </p>
                <Link
                    href="/"
                    className="mt-6 inline-block text-sm underline underline-offset-4 text-muted-foreground hover:text-foreground"
                >
                    На главную
                </Link>
            </div>
        </div>
    );
}