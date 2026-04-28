import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import OpenAI from "openai";

const schema = z.object({
    query: z.string().min(3).max(1000),
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

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { query } = schema.parse(body);

        const doctors = await prisma.doctor.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                speciality: true,
                bio: true,
                tenant: { select: { name: true, slug: true, address: true } },
                services: {
                    where: { isActive: true },
                    select: { name: true, duration: true },
                },
                schedules: {
                    where: { isActive: true },
                    select: { weekday: true, startTime: true, endTime: true },
                },
            },
        });

        if (doctors.length === 0) {
            return NextResponse.json({ results: [], usedFallback: true });
        }

        const DAYS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

        const doctorList = doctors
            .map((d, i) => {
                const services = d.services.map((s) => `${s.name} (${s.duration} мин)`).join(", ") || "не указаны";
                const schedule = d.schedules.length > 0
                    ? d.schedules.map((s) => `${DAYS[s.weekday]} ${s.startTime}–${s.endTime}`).join(", ")
                    : "расписание не задано";
                return `${i + 1}. ID: ${d.id} | ${d.name} | Специальность: ${d.speciality ?? "не указана"} | Клиника: "${d.tenant.name}"${d.tenant.address ? ` (${d.tenant.address})` : ""} | Услуги: ${services} | Расписание: ${schedule}${d.bio ? ` | О враче: ${d.bio}` : ""}`;
            })
            .join("\n");

        const systemPrompt = `Ты — умный поиск для платформы записи к врачам МедГарант.
Пользователь описывает что ему нужно: симптомы, специальность, услугу, адрес или удобное время.
Найди до 5 наиболее подходящих специалистов из списка ниже.
Учитывай: специальность, услуги, адрес клиники, расписание (если пользователь упомянул удобное время).
Не ставь диагнозы. Не назначай лечение. Только подбирай специалиста.

Список специалистов:
${doctorList}

Ответь СТРОГО в формате JSON без markdown:
{"results":[{"doctorId":"<ID из списка>","reasoning":"<1-2 предложения на русском почему подходит>"}]}
Если никто не подходит — верни пустой массив.`;

        try {
            const ai = getClient();
            const completion = await ai.chat.completions.create(
                {
                    model: "openai/gpt-oss-120b:free",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: query },
                    ],
                    temperature: 0.2,
                    max_tokens: 700,
                    response_format: { type: "json_object" },
                },
                { signal: AbortSignal.timeout(parseInt(process.env.OPENROUTER_TIMEOUT_MS ?? "15000")) }
            );

            const raw = completion.choices[0]?.message?.content ?? "{}";
            let parsed: { results?: Array<{ doctorId: string; reasoning: string }> };

            try {
                parsed = JSON.parse(raw);
            } catch {
                return NextResponse.json({ results: [], usedFallback: true });
            }

            const doctorMap = new Map(doctors.map((d) => [d.id, d]));

            const validResults = (parsed.results ?? [])
                .filter((r) => doctorMap.has(r.doctorId))
                .map((r) => {
                    const doc = doctorMap.get(r.doctorId)!;
                    return {
                        doctorId: doc.id,
                        doctorName: doc.name,
                        speciality: doc.speciality,
                        clinicSlug: doc.tenant.slug,
                        clinicName: doc.tenant.name,
                        clinicAddress: doc.tenant.address,
                        reasoning: r.reasoning ?? "",
                    };
                });

            return NextResponse.json({ results: validResults, usedFallback: false });
        } catch (aiErr) {
            console.error("[ai/search] error:", aiErr);
            return NextResponse.json({ results: [], usedFallback: true });
        }
    } catch (e) {
        if (e instanceof z.ZodError) {
            return NextResponse.json({ error: { code: "VALIDATION_ERROR" } }, { status: 400 });
        }
        console.error("[ai/search]", e);
        return NextResponse.json({ results: [], usedFallback: true });
    }
}
