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
        logo: string | null;
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

    const doctorSelect = {
        where: { isActive: true },
        select: { id: true, name: true, speciality: true, services: { where: { isActive: true }, select: { id: true } } },
        orderBy: { name: "asc" as const },
    };

    try {
        tenants = await prisma.tenant.findMany({
            select: { id: true, name: true, slug: true, logo: true, address: true, latitude: true, longitude: true, phone: true, doctors: doctorSelect },
            orderBy: { name: "asc" },
        });
    } catch {
        tenants = await prisma.tenant.findMany({
            select: { id: true, name: true, slug: true, logo: true, address: true, phone: true, doctors: doctorSelect },
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

    return <HomeCatalog initialView={view} clinics={clinics} />;
}