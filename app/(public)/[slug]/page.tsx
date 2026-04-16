import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { MapPin, Phone, Clock } from "lucide-react";
import { BookingWizard } from "@/components/booking/BookingWizard";

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

    const tenant = await prisma.tenant.findUnique({
        where: { slug },
        select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            logo: true,
            primaryColor: true,
            doctors: {
                where: { isActive: true },
                select: {
                    id: true,
                    name: true,
                    speciality: true,
                    bio: true,
                    avatarUrl: true,
                    services: {
                        where: { isActive: true },
                        select: { id: true, name: true, duration: true, price: true },
                    },
                },
                orderBy: { name: "asc" },
            },
        },
    });

    if (!tenant) notFound();

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10">
                <div className="mx-auto max-w-2xl px-4 py-4 flex items-center gap-3">
                    {tenant.logo ? (
                        <img src={tenant.logo} alt={tenant.name} className="size-10 rounded-xl object-cover" />
                    ) : (
                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">
                            🏥
                        </div>
                    )}
                    <div>
                        <h1 className="font-semibold text-base leading-tight">{tenant.name}</h1>
                        {tenant.address && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin className="size-3" /> {tenant.address}
                            </p>
                        )}
                    </div>
                    {tenant.phone && (
                        <a
                            href={`tel:${tenant.phone}`}
                            className="ml-auto flex items-center gap-1.5 text-sm font-medium hover:opacity-80"
                        >
                            <Phone className="size-4" />
                            <span className="hidden sm:block">{tenant.phone}</span>
                        </a>
                    )}
                </div>
            </header>

            <main className="mx-auto max-w-2xl px-4 py-6">
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
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold">Онлайн запись</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Выберите специалиста, удобное время и оставьте контактные данные
                            </p>
                        </div>

                        <BookingWizard
                            slug={slug}
                            doctors={tenant.doctors}
                            primaryColor={tenant.primaryColor}
                        />
                    </>
                )}
            </main>

            <footer className="mt-12 py-6 border-t border-border text-center text-xs text-muted-foreground">
                Запись работает на платформе{" "}
                <span className="font-medium text-foreground">МедГарант</span>
            </footer>
        </div>
    );
}