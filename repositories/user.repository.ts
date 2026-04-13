import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

export const userRepository = {
    findByEmail: (email: string) =>
        prisma.user.findUnique({ where: { email }, include: { tenant: true } }),

    findById: (id: string) =>
        prisma.user.findUnique({ where: { id }, include: { tenant: true } }),

    create: (data: {
        email: string;
        password: string;
        role: UserRole;
        tenantId: string;
    }) => prisma.user.create({ data }),
};