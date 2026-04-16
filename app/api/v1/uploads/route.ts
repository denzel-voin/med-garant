import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { getTenantContext } from "@/lib/api-helpers";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

function extFromMime(mime: string): string {
    if (mime === "image/png") return "png";
    if (mime === "image/webp") return "webp";
    return "jpg";
}

export async function POST(req: NextRequest) {
    try {
        const ctx = getTenantContext(req);
        if (!["OWNER", "ADMIN"].includes(ctx.role)) {
            return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
        }

        const form = await req.formData();
        const file = form.get("file");
        const kindValue = form.get("kind");
        const kind = kindValue === "logo" ? "logo" : "doctor";
        if (!(file instanceof File)) {
            return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Файл не передан" } }, { status: 400 });
        }

        if (!ALLOWED_MIME.has(file.type)) {
            return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Разрешены только JPG/PNG/WEBP" } }, { status: 400 });
        }
        if (file.size > MAX_SIZE_BYTES) {
            return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Файл должен быть меньше 5 МБ" } }, { status: 400 });
        }

        const bytes = Buffer.from(await file.arrayBuffer());
        const ext = extFromMime(file.type);
        const filename = `${crypto.randomUUID()}.${ext}`;
        const folder = kind === "logo" ? "logos" : "doctors";
        const relDir = path.join("uploads", ctx.tenantId, folder);
        const absDir = path.join(process.cwd(), "public", relDir);
        await mkdir(absDir, { recursive: true });
        await writeFile(path.join(absDir, filename), bytes);

        return NextResponse.json({ url: `/${relDir}/${filename}` }, { status: 201 });
    } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "UNAUTHORIZED") {
            return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
        }
        return NextResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 });
    }
}
