import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import OpenAI from "openai";

const schema = z.object({
    tenantSlug: z.string().min(1),
    symptoms: z.string().min(5).max(1000),
});

let client: OpenAI | null = null;

function getClient(): OpenAI {
    if (!client) {
        client = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: process.env.OPENROUTER_API_KEY ?? "",
            defaultHeaders: {
                "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
                "X-Title": "MedGarant",
            },
        });
    }
    return client;
}

const MODEL = "openai/gpt-oss-120b:free";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { tenantSlug, symptoms } = schema.parse(body);

        const tenant = await prisma.tenant.findUnique({
            where: { slug: tenantSlug },
            select: { id: true, name: true },
        });
        if (!tenant) {
            return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
        }

        const doctors = await prisma.doctor.findMany({
            where: { tenantId: tenant.id, isActive: true },
            select: { id: true, name: true, speciality: true, bio: true },
        });

        if (doctors.length === 0) {
            return NextResponse.json({ recommendation: null, usedFallback: true });
        }

        const doctorList = doctors
            .map(
                (d, i) =>
                    `${i + 1}. ID: ${d.id} | Имя: ${d.name} | Специальность: ${d.speciality ?? "не указана"}${d.bio ? ` | Описание: ${d.bio}` : ""}`
            )
            .join("\n");

        const systemPrompt = `Ты — помощник регистратуры клиники "${tenant.name}". 
        Твоя единственная задача — помочь пациенту выбрать подходящего специалиста из списка на основе его жалоб.
        Ты НЕ ставишь диагнозы и НЕ назначаешь лечение. Ты только направляешь к нужному специалисту.
        
        Список доступных специалистов:
        ${doctorList}
        
        Ответь СТРОГО в формате JSON (без markdown, без пояснений):
        {"specialistId":"<ID из списка выше>","specialistName":"<имя специалиста>","reasoning":"<1-2 предложения на русском, почему именно этот специалист>"}`;

        try {
            const ai = getClient();

            const completion = await ai.chat.completions.create(
                {
                    model: MODEL,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: `Жалобы пациента: ${symptoms}` },
                    ],
                    temperature: 0.2,
                    max_tokens: 250,
                    response_format: { type: "json_object" },
                },
                {
                    signal: AbortSignal.timeout(
                        parseInt(process.env.OPENROUTER_TIMEOUT_MS ?? "15000")
                    ),
                }
            );

            const raw = completion.choices[0]?.message?.content ?? "{}";

            let parsed: {
                specialistId?: string;
                specialistName?: string;
                reasoning?: string;
            };

            try {
                parsed = JSON.parse(raw);
            } catch {
                console.error("[ai/recommend] Failed to parse JSON:", raw);
                return NextResponse.json({ recommendation: null, usedFallback: true });
            }

            const validDoctor = doctors.find((d) => d.id === parsed.specialistId);
            if (!validDoctor) {
                console.warn("[ai/recommend] Model returned invalid specialistId:", parsed.specialistId);
                return NextResponse.json({ recommendation: null, usedFallback: true });
            }

            return NextResponse.json({
                recommendation: {
                    specialistId: validDoctor.id,
                    specialistName: validDoctor.name,
                    reasoning: parsed.reasoning ?? "",
                },
                usedFallback: false,
            });
        } catch (aiErr) {
            console.error("[ai/recommend] OpenRouter error:", aiErr);
            return NextResponse.json({ recommendation: null, usedFallback: true });
        }
    } catch (e) {
        if (e instanceof z.ZodError) {
            return NextResponse.json(
                { error: { code: "VALIDATION_ERROR", details: e.issues } },
                { status: 400 }
            );
        }
        console.error("[ai/recommend]", e);
        return NextResponse.json({ recommendation: null, usedFallback: true });
    }
}