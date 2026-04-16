"use client";

import Script from "next/script";

export function YandexMapScript() {
    const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY

    return (
        <Script
            src={`https://api-maps.yandex.ru/2.1?apikey=${apiKey}&lang=ru_RU`}
            strategy="afterInteractive"
        />
    );
}
