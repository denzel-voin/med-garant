import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { MapPin, Phone, Clock, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { DoctorsWithReviews } from "@/components/reviews/DoctorsWithReviews";

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
    const { slug } = await params;
    const tenant = await prisma.tenant.findUnique({
        where: { slug },
        select: { name: true },
    });
    if (!tenant) return { title: "Клиника не найдена" };
    return {
        title: `${tenant.name} — онлайн запись`,
        description: `Запишитесь онлайн в ${tenant.name}. Быстро, удобно, без звонков.`,
    };
}

export default async function ClinicPage({ params }: Props) {
    const { slug } = await params;

    let isPatient = false;
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("access_token")?.value;
        if (token) {
            const payload = await verifyAccessToken(token);
            isPatient = payload.role === "PATIENT";
        }
    } catch {}

    const tenant = await prisma.tenant.findUnique({
        where: { slug },
        select: {
            id: true, name: true, address: true, phone: true, logo: true, primaryColor: true,
            doctors: {
                where: { isActive: true },
                select: {
                    id: true, name: true, speciality: true, bio: true, avatarUrl: true,
                    services: {
                        where: { isActive: true },
                        select: { id: true, name: true, duration: true, price: true },
                    },
                    reviews: { select: { rating: true } },
                },
                orderBy: { name: "asc" },
            },
        },
    });

    if (!tenant) notFound();

    const doctorsWithRating = tenant.doctors.map((d) => ({
        ...d,
        averageRating:
            d.reviews.length > 0
                ? Math.round((d.reviews.reduce((s, r) => s + r.rating, 0) / d.reviews.length) * 10) / 10
                : null,
        reviewCount: d.reviews.length,
    }));

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10">
                <div className="mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
                    <Link
                        href="/"
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    >
                        <ChevronLeft className="size-4" />
                        <span className="hidden sm:inline">Все клиники</span>
                    </Link>

                    <div className="flex items-center gap-2.5 min-w-0">
                        {tenant.logo ? (
                            <img src={tenant.logo} alt={tenant.name} className="size-8 rounded-lg object-cover shrink-0" />
                        ) : (
                            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-base shrink-0">🏥</div>
                        )}
                        <div className="min-w-0">
                            <h1 className="font-semibold text-sm leading-tight truncate">{tenant.name}</h1>
                            {tenant.address && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                                    <MapPin className="size-3 shrink-0" /> {tenant.address}
                                </p>
                            )}
                        </div>
                    </div>

                    {tenant.phone && (
                        <a href={`tel:${tenant.phone}`} className="ml-auto flex items-center gap-1.5 text-sm font-medium hover:opacity-80 shrink-0">
                            <Phone className="size-4" />
                            <span className="hidden sm:block">{tenant.phone}</span>
                        </a>
                    )}
                </div>
            </header>

            <main className="mx-auto max-w-2xl px-4 py-6 space-y-10">
                {tenant.doctors.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                        <Clock className="size-10 mx-auto mb-3 opacity-40" />
                        <p className="font-medium">Запись временно недоступна</p>
                        <p className="text-sm mt-1">Пожалуйста, позвоните в клинику</p>
                        {tenant.phone && (
                            <a href={`tel:${tenant.phone}`} className="mt-3 inline-block font-semibold text-foreground underline underline-offset-4">
                                {tenant.phone}
                            </a>
                        )}
                    </div>
                ) : (
                    <>
                        <section>
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold">Онлайн запись</h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Выберите специалиста, удобное время и оставьте контактные данные
                                </p>
                            </div>
                            <BookingWizard slug={slug} doctors={doctorsWithRating} primaryColor={tenant.primaryColor} />
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-4">Отзывы о специалистах</h2>
                            <DoctorsWithReviews doctors={doctorsWithRating} />
                        </section>
                    </>
                )}
            </main>

            <footer className="mt-12 py-6 border-t border-border text-center text-xs text-muted-foreground">
                Запись работает на платформе{" "}
                <span className="font-medium text-foreground">МедГарант</span>
                {" · "}
                {isPatient ? (
                    <Link href="/me" className="underline underline-offset-2 hover:text-foreground">
                        Мой кабинет
                    </Link>
                ) : (
                    <Link href="/login-patient" className="underline underline-offset-2 hover:text-foreground">
                        Войти как пациент
                    </Link>
                )}
            </footer>
        </div>
    );
}