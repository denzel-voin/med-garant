import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/db";
import { signAccessToken, signRefreshToken, setAuthCookies } from "@/lib/auth";
import { registerPatientSchema as schema } from "@/lib/validators";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const data = schema.parse(body);

        const existing = await prisma.user.findUnique({ where: { email: data.email } });
        if (existing) {
            return NextResponse.json(
                { error: { code: "EMAIL_TAKEN", message: "Email уже зарегистрирован" } },
                { status: 409 }
            );
        }

        const passwordHash = await bcrypt.hash(data.password, 12);

        const PATIENT_TENANT_SLUG = "__patients__";
        let patientTenant = await prisma.tenant.findUnique({ where: { slug: PATIENT_TENANT_SLUG } });
        if (!patientTenant) {
            patientTenant = await prisma.tenant.create({
                data: { name: "Пациенты", slug: PATIENT_TENANT_SLUG, email: "patients@system" },
            });
        }

        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: data.email,
                    password: passwordHash,
                    role: "PATIENT",
                    tenantId: patientTenant!.id,
                },
            });
            const profile = await tx.patientProfile.create({
                data: {
                    userId: user.id,
                    fullName: data.fullName,
                    phone: data.phone ?? null,
                },
            });
            return { user, profile };
        });

        const [accessToken, refreshToken] = await Promise.all([
            signAccessToken({
                userId: result.user.id,
                tenantId: patientTenant.id,
                role: "PATIENT",
                email: result.user.email,
            }),
            signRefreshToken(result.user.id),
        ]);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await prisma.refreshToken.create({
            data: { token: refreshToken, userId: result.user.id, expiresAt },
        });

        await setAuthCookies(accessToken, refreshToken);

        return NextResponse.json(
            {
                user: {
                    userId: result.user.id,
                    email: result.user.email,
                    role: "PATIENT",
                    fullName: result.profile.fullName,
                },
            },
            { status: 201 }
        );
    } catch (e) {
        if (e instanceof z.ZodError) {
            return NextResponse.json({ error: { code: "VALIDATION_ERROR", details: e.issues } }, { status: 400 });
        }
        console.error("[register-patient]", e);
        return NextResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 });
    }
}