import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const ACCESS_SECRET = new TextEncoder().encode(
    process.env.JWT_ACCESS_SECRET ?? "dev-access-secret-min-32-chars!!"
);
const REFRESH_SECRET = new TextEncoder().encode(
    process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret-min-32-chars!"
);

export interface JWTPayload {
    userId: string;
    tenantId: string;
    role: string;
    email: string;
}

export async function signAccessToken(payload: JWTPayload): Promise<string> {
    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("60m")
        .sign(ACCESS_SECRET);
}

export async function verifyAccessToken(token: string): Promise<JWTPayload> {
    const { payload } = await jwtVerify(token, ACCESS_SECRET);
    return payload as unknown as JWTPayload;
}

export async function signRefreshToken(userId: string): Promise<string> {
    return new SignJWT({ userId })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(REFRESH_SECRET);
}

export async function verifyRefreshToken(token: string): Promise<{ userId: string }> {
    const { payload } = await jwtVerify(token, REFRESH_SECRET);
    return payload as unknown as { userId: string };
}

export async function setAuthCookies(accessToken: string, refreshToken: string) {
    const cookieStore = await cookies();
    cookieStore.set("access_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60, // 1h
        path: "/",
    });
    cookieStore.set("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7, // 7d
        path: "/",
    });
}

export async function clearAuthCookies() {
    const cookieStore = await cookies();
    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");
}

export async function getAccessTokenFromCookies(): Promise<string | undefined> {
    const cookieStore = await cookies();
    return cookieStore.get("access_token")?.value;
}