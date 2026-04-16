"use client";

import { useEffect, useRef } from "react";
import { YandexMapScript } from "./YandexMapScript";

declare global {
    interface Window {
        ymaps?: any;
    }
}

type Props = {
    latitude: number | null;
    longitude: number | null;
    addressToLocate?: string;
    onPick: (next: { latitude: number; longitude: number; address?: string }) => void;
};

export function YandexAddressPicker({ latitude, longitude, addressToLocate, onPick }: Props) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<any>(null);
    const placemarkRef = useRef<any>(null);
    const initedRef = useRef(false);

    useEffect(() => {
        if (!containerRef.current || initedRef.current) return;

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

            const center: [number, number] =
                latitude != null && longitude != null ? [latitude, longitude] : [55.751244, 37.618423];

            const map = new window.ymaps.Map(containerRef.current, {
                center,
                zoom: latitude != null && longitude != null ? 14 : 10,
                controls: ["zoomControl", "searchControl"],
            });
            mapRef.current = map;
            initedRef.current = true;

            const fit = () => map.container.fitToViewport();
            requestAnimationFrame(fit);
            setTimeout(fit, 120);
            window.addEventListener("resize", fit);
            resizeHandler = () => window.removeEventListener("resize", fit);

            let placemark =
                latitude != null && longitude != null
                    ? new window.ymaps.Placemark([latitude, longitude], {}, { draggable: true, preset: "islands#violetDotIcon" })
                    : null;
            placemarkRef.current = placemark;

            if (placemark) map.geoObjects.add(placemark);

            const applyCoords = async (coords: number[]) => {
                const [lat, lng] = coords;
                if (!placemark) {
                    placemark = new window.ymaps.Placemark(coords, {}, { draggable: true, preset: "islands#violetDotIcon" });
                    placemarkRef.current = placemark;
                    map.geoObjects.add(placemark);
                } else {
                    placemark.geometry.setCoordinates(coords);
                }
                map.setCenter(coords, 15, { duration: 200 });

                try {
                    const geo = await window.ymaps.geocode(coords);
                    const address = geo.geoObjects.get(0)?.getAddressLine?.();
                    onPick({ latitude: lat, longitude: lng, address });
                } catch {
                    onPick({ latitude: lat, longitude: lng });
                }
            };

            map.events.add("click", (e: any) => {
                const coords = e.get("coords");
                applyCoords(coords);
            });

            if (placemark) {
                placemark.events.add("dragend", () => {
                    const coords = placemark.geometry.getCoordinates();
                    applyCoords(coords);
                });
            }
        };

        initMap();

        return () => {
            cancelled = true;
            if (resizeHandler) resizeHandler();
            if (mapRef.current) {
                mapRef.current.destroy();
                mapRef.current = null;
            }
            placemarkRef.current = null;
            initedRef.current = false;
        };
    }, [latitude, longitude, onPick]);

    useEffect(() => {
        if (!window.ymaps || !mapRef.current) return;
        const targetAddress = (addressToLocate ?? "").trim();
        if (!targetAddress) return;

        (async () => {
            try {
                const geo = await window.ymaps.geocode(targetAddress);
                const first = geo.geoObjects.get(0);
                if (!first) return;
                const coords = first.geometry.getCoordinates();
                const [lat, lng] = coords;
                const map = mapRef.current;
                let placemark = placemarkRef.current;

                if (!placemark) {
                    placemark = new window.ymaps.Placemark(coords, {}, { draggable: true, preset: "islands#violetDotIcon" });
                    placemarkRef.current = placemark;
                    map.geoObjects.add(placemark);
                } else {
                    placemark.geometry.setCoordinates(coords);
                }
                map.setCenter(coords, 15, { duration: 200 });
                map.container.fitToViewport();
                onPick({ latitude: lat, longitude: lng, address: first.getAddressLine?.() ?? targetAddress });
            } catch {
                // Ignore geocoding errors for invalid addresses.
            }
        })();
    }, [addressToLocate, onPick]);

    return (
        <div className="space-y-1.5">
            <YandexMapScript />
            <div
                ref={containerRef}
                className="h-72 w-full rounded-2xl border border-violet-200 bg-violet-50/30 shadow-inner overflow-hidden"
            />
            <p className="text-xs text-muted-foreground">
                Адрес автоматически отображается на карте. Можно кликнуть по карте или перетащить метку.
            </p>
        </div>
    );
}
