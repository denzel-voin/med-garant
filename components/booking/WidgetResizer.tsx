"use client";

import { useEffect } from "react";

export function WidgetResizer() {
    useEffect(() => {
        function sendHeight() {
            const root = document.getElementById("widget-root");
            if (!root) return;
            const height = root.scrollHeight;
            window.parent.postMessage({ type: "medgarant:resize", height }, "*");
        }

        sendHeight();

        const observer = new ResizeObserver(sendHeight);
        const root = document.getElementById("widget-root");
        if (root) observer.observe(root);

        return () => observer.disconnect();
    }, []);

    return null;
}