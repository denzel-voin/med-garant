import Link from "next/link";
import { prisma } from "@/lib/db";
import { HomeCatalog } from "@/components/home/HomeCatalog";

type HomeProps = {
    searchParams?: Promise<{ view?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
    const params = (await searchParams) ?? {};
    const view = params.view === "doctors" ? "doctors" : "clinics";

    let tenants: Array<{
        id: string;
        name: string;
        slug: string;
        address: string | null;
        latitude?: number | null;
        longitude?: number | null;
        phone: string | null;
        doctors: Array<{
            id: string;
            name: string;
            speciality: string | null;
            services: Array<{ id: string }>;
        }>;
    }> = [];

    try {
        tenants = await prisma.tenant.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
                address: true,
                latitude: true,
                longitude: true,
                phone: true,
                doctors: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        name: true,
                        speciality: true,
                        services: {
                            where: { isActive: true },
                            select: { id: true },
                        },
                    },
                    orderBy: { name: "asc" },
                },
            },
            orderBy: { name: "asc" },
        });
    } catch {
        // Backward compatibility while DB/Prisma client is not migrated yet.
        tenants = await prisma.tenant.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
                address: true,
                phone: true,
                doctors: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        name: true,
                        speciality: true,
                        services: {
                            where: { isActive: true },
                            select: { id: true },
                        },
                    },
                    orderBy: { name: "asc" },
                },
            },
            orderBy: { name: "asc" },
        });
    }

    const clinics = tenants
        .map((t) => ({
            ...t,
            doctors: t.doctors
                .filter((d) => d.services.length > 0)
                .map((d) => ({
                    id: d.id,
                    name: d.name,
                    speciality: d.speciality,
                    servicesCount: d.services.length,
                })),
        }))
        .filter((t) => t.doctors.length > 0);

    return (
        <main className="min-h-screen bg-background">
            <HomeCatalog initialView={view} clinics={clinics} />
            <section className="mx-auto max-w-5xl px-4 pb-8 flex items-center justify-between text-sm text-muted-foreground">
                <p>© {new Date().getFullYear()} МедГарант</p>
                <Link href="/login" className="hover:text-foreground transition">
                    Администратор
                </Link>
            </section>
        </main>
    );
}