"use client";

import { useEffect, useRef } from "react";
import { YandexMapScript } from "./YandexMapScript";

type Clinic = {
    name: string;
    slug: string;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
};

declare global {
    interface Window {
        ymaps?: any;
    }
}

export function YandexClinicMap({ clinics }: { clinics: Clinic[] }) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<any>(null);

    useEffect(() => {
        const withCoords = clinics.filter((c) => c.latitude != null && c.longitude != null);
        if (!containerRef.current || withCoords.length === 0) return;

        let cancelled = false;
        let resizeHandler: (() => void) | null = null;

        const initMap = async () => {
            const waitUntil = Date.now() + 8000;
            while (!window.ymaps && Date.now() < waitUntil) {
                await new Promise((resolve) => setTimeout(resolve, 80));
                if (cancelled) return;
            }
            if (!window.ymaps || !containerRef.current || cancelled) return;

            await new Promise<void>((resolve) => window.ymaps.ready(resolve));
            if (cancelled || !containerRef.current) return;

            if (mapRef.current) {
                mapRef.current.destroy();
                mapRef.current = null;
            }

            const first = withCoords[0];
            const map = new window.ymaps.Map(containerRef.current, {
                center: [first.latitude, first.longitude],
                zoom: 10,
                controls: ["zoomControl", "fullscreenControl"],
            });
            mapRef.current = map;

            for (const clinic of withCoords) {
                const placemark = new window.ymaps.Placemark(
                    [clinic.latitude, clinic.longitude],
                    {
                        balloonContentHeader: clinic.name,
                        balloonContentBody: clinic.address ?? "Адрес не указан",
                        balloonContentFooter: `<a href="/${clinic.slug}">Перейти к записи</a>`,
                    }
                );
                map.geoObjects.add(placemark);
            }

            const fit = () => map.container.fitToViewport();
            requestAnimationFrame(fit);
            setTimeout(fit, 120);
            window.addEventListener("resize", fit);
            resizeHandler = () => window.removeEventListener("resize", fit);
        };

        initMap();

        return () => {
            cancelled = true;
            if (resizeHandler) resizeHandler();
            if (mapRef.current) {
                mapRef.current.destroy();
                mapRef.current = null;
            }
        };
    }, [clinics]);

    const hasCoords = clinics.some((c) => c.latitude != null && c.longitude != null);

    return (
        <div className="space-y-3">
            <YandexMapScript />

            {!hasCoords ? (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-500">
                    Для отображения карты укажите координаты клиник в настройках.
                </div>
            ) : (
                <div
                    className="
                    relative
                    h-80 w-full
                    overflow-hidden
                    rounded-3xl
                    border border-neutral-200
                    bg-white/70
                    shadow-[0_8px_30px_rgba(0,0,0,0.06)]
                    backdrop-blur
                    transition-all
                    duration-300
                    hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]
                "
                >
                    <div
                        ref={containerRef}
                        className="absolute inset-0"
                    />

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/40 to-transparent" />
                </div>
            )}
        </div>
    );
}
