import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const tenant = await prisma.tenant.findUnique({
        where: { slug },
        select: {
            id: true,
            name: true,
            slug: true,
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
            },
        },
    });

    if (!tenant) {
        return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    }

    return NextResponse.json(tenant);
}