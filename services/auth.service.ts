import bcrypt from "bcrypt";
import { prisma } from "@/lib/db";
import { userRepository } from "@/repositories/user.repository";
import { signAccessToken, signRefreshToken, verifyRefreshToken, type JWTPayload } from "@/lib/auth";

const BCRYPT_ROUNDS = 12;

export const authService = {
    async register(data: {
        clinicName: string;
        slug: string;
        email: string;
        password: string;
    }) {
        const existing = await prisma.tenant.findUnique({ where: { slug: data.slug } });
        if (existing) throw new Error("SLUG_TAKEN");

        const existingUser = await userRepository.findByEmail(data.email);
        if (existingUser) throw new Error("EMAIL_TAKEN");

        const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

        const result = await prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: { name: data.clinicName, slug: data.slug, email: data.email },
            });
            const user = await tx.user.create({
                data: { email: data.email, password: passwordHash, role: "OWNER", tenantId: tenant.id },
            });
            return { tenant, user };
        });

        return authService._issueTokens(result.user.id, result.user.tenantId, result.user.role, result.user.email);
    },

    async login(email: string, password: string) {
        const user = await userRepository.findByEmail(email);
        if (!user) throw new Error("INVALID_CREDENTIALS");

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) throw new Error("INVALID_CREDENTIALS");

        return authService._issueTokens(user.id, user.tenantId, user.role, user.email);
    },

    async refresh(rawRefreshToken: string) {
        const { userId } = await verifyRefreshToken(rawRefreshToken);

        const stored = await prisma.refreshToken.findUnique({ where: { token: rawRefreshToken } });
        if (!stored || stored.expiresAt < new Date()) throw new Error("INVALID_REFRESH_TOKEN");

        const user = await userRepository.findById(userId);
        if (!user) throw new Error("USER_NOT_FOUND");

        await prisma.refreshToken.delete({ where: { id: stored.id } });
        return authService._issueTokens(user.id, user.tenantId, user.role, user.email);
    },

    async logout(rawRefreshToken: string) {
        await prisma.refreshToken.deleteMany({ where: { token: rawRefreshToken } }).catch(() => {});
    },

    async _issueTokens(userId: string, tenantId: string, role: string, email: string) {
        const payload: JWTPayload = { userId, tenantId, role, email };
        const [accessToken, refreshToken] = await Promise.all([
            signAccessToken(payload),
            signRefreshToken(userId),
        ]);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await prisma.refreshToken.create({
            data: { token: refreshToken, userId, expiresAt },
        });

        return { accessToken, refreshToken, user: { userId, tenantId, role, email } };
    },
};