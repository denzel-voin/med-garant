import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { WidgetResizer } from "@/components/booking/WidgetResizer";

interface Props {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ color?: string }>;
}

export default async function WidgetPage({ params, searchParams }: Props) {
    const { slug } = await params;
    const { color } = await searchParams;

    const tenant = await prisma.tenant.findUnique({
        where: { slug },
        select: {
            name: true,
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

    const primaryColor = color
        ? `#${color.replace("#", "")}`
        : tenant.primaryColor;

    return (
        <>
            <style>{`
        :root { --widget-primary: ${primaryColor}; }
        body { background: transparent; margin: 0; padding: 0; }
      `}</style>

            <WidgetResizer />

            <div id="widget-root" className="p-4">
                {tenant.doctors.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        Запись временно недоступна
                    </p>
                ) : (
                    <BookingWizard
                        slug={slug}
                        doctors={tenant.doctors}
                        primaryColor={primaryColor}
                        compact
                    />
                )}
            </div>
        </>
    );
}