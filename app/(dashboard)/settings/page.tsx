"use client";

import React, { useEffect, useState } from "react";
import { Copy, Check, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { YandexAddressPicker } from "@/components/maps/YandexAddressPicker";

declare global {
    interface Window {
        ymaps?: any;
    }
}

interface TenantSettings {
    id: string;
    name: string;
    slug: string;
    email: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    phone: string | null;
    logo: string | null;
    primaryColor: string;
}

const APP_URL =
    typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL ?? "https://medgarant.ru";

export default function SettingsPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<TenantSettings | null>(null);
    const [form, setForm] = useState({
        name: "", address: "", phone: "", logo: "", primaryColor: "#2E75B6",
        latitude: null as number | null,
        longitude: null as number | null,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [copied, setCopied] = useState(false);
    const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
    const [addressToLocate, setAddressToLocate] = useState("");

    useEffect(() => {
        fetch("/api/v1/settings")
            .then((r) => r.json())
            .then((data: TenantSettings) => {
                setSettings(data);
                setForm({
                    name: data.name,
                    address: data.address ?? "",
                    latitude: data.latitude ?? null,
                    longitude: data.longitude ?? null,
                    phone: data.phone ?? "",
                    logo: data.logo ?? "",
                    primaryColor: data.primaryColor,
                });
                if (data.address) setAddressToLocate(data.address);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (typeof window === "undefined" || !window.ymaps) return;
        if (form.address.trim().length < 3) {
            setAddressSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const res = await window.ymaps.suggest(form.address);
                const values = (res ?? []).map((x: { value?: string }) => x.value).filter(Boolean) as string[];
                setAddressSuggestions(values.slice(0, 5));
            } catch {
                setAddressSuggestions([]);
            }
        }, 250);

        return () => clearTimeout(timer);
    }, [form.address]);

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch("/api/v1/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                const updated: TenantSettings = await res.json();
                setSettings(updated);
                toast("Настройки сохранены", "success");
            } else {
                const err = await res.json();
                toast(err.error?.message ?? "Ошибка сохранения", "error");
            }
        } finally {
            setSaving(false);
        }
    }

    async function handleLogoUpload(file: File) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("kind", "logo");
        setUploadingLogo(true);
        try {
            const res = await fetch("/api/v1/uploads", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) {
                toast(data.error?.message ?? "Ошибка загрузки логотипа", "error");
                return;
            }
            setForm((f) => ({ ...f, logo: data.url ?? "" }));
            toast("Логотип загружен", "success");
        } catch {
            toast("Ошибка загрузки логотипа", "error");
        } finally {
            setUploadingLogo(false);
        }
    }

    const widgetUrl = settings
        ? `${APP_URL}/widget/${settings.slug}?color=${encodeURIComponent(form.primaryColor.replace("#", ""))}`
        : "";

    const widgetCode = settings
        ? `<!-- МедГарант: Виджет онлайн-записи -->
<iframe
  src="${widgetUrl}"
  width="100%"
  height="600"
  frameborder="0"
  style="border-radius:16px;border:1px solid #e5e7eb;"
  allow="clipboard-write"
></iframe>
<script>
  window.addEventListener("message", function(e) {
    if (e.data && e.data.type === "medgarant:resize") {
      var iframe = document.querySelector('iframe[src*="${settings.slug}"]');
      if (iframe) iframe.style.height = e.data.height + "px";
    }
  });
</script>`
        : "";

    async function copyWidget() {
        await navigator.clipboard.writeText(widgetCode);
        setCopied(true);
        toast("Код скопирован в буфер обмена", "success");
        setTimeout(() => setCopied(false), 2000);
    }

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl">

            <Card>
                <CardHeader>
                    <CardTitle>Профиль клиники</CardTitle>
                    <CardDescription>Эта информация отображается на публичной странице записи</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Название клиники *</Label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                required
                                minLength={2}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Телефон</Label>
                                <Input
                                    type="tel"
                                    placeholder="+7 (999) 000-00-00"
                                    value={form.phone}
                                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Адрес</Label>
                                <div className="relative">
                                    <Input
                                        placeholder="ул. Ленина, 1"
                                        value={form.address}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setForm((f) => ({ ...f, address: value }));
                                        }}
                                        onBlur={() => {
                                            setTimeout(() => setAddressSuggestions([]), 120);
                                        }}
                                    />
                                    {addressSuggestions.length > 0 && (
                                        <div className="absolute z-30 mt-1 w-full rounded-xl border border-border bg-popover shadow-lg overflow-hidden">
                                            {addressSuggestions.map((item) => (
                                                <button
                                                    key={item}
                                                    type="button"
                                                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        setForm((f) => ({ ...f, address: item }));
                                                        setAddressToLocate(item);
                                                        setAddressSuggestions([]);
                                                    }}
                                                >
                                                    {item}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <YandexAddressPicker
                            latitude={form.latitude}
                            longitude={form.longitude}
                            addressToLocate={addressToLocate}
                            onPick={({ latitude, longitude, address }) =>
                                setForm((f) => ({
                                    ...f,
                                    latitude,
                                    longitude,
                                    address: address ?? f.address,
                                }))
                            }
                        />

                        <div className="space-y-1.5">
                            <Label>Логотип клиники</Label>
                            <Input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleLogoUpload(file);
                                }}
                            />
                            <p className="text-xs text-muted-foreground">JPG, PNG или WEBP, до 5 МБ</p>
                            {uploadingLogo && (
                                <p className="text-xs text-muted-foreground">Загружаем логотип...</p>
                            )}
                            {form.logo && (
                                <div className="pt-2 flex items-center gap-2">
                                    <img
                                        src={form.logo}
                                        alt="Логотип клиники"
                                        className="size-14 rounded-lg border border-border object-cover bg-muted"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setForm((f) => ({ ...f, logo: "" }))}
                                    >
                                        Удалить
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label>
                                Цвет виджета{" "}
                                <span className="text-muted-foreground text-xs font-normal">(HEX)</span>
                            </Label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={form.primaryColor}
                                    onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                                    className="size-10 rounded-lg border border-border cursor-pointer p-0.5 bg-background"
                                />
                                <Input
                                    value={form.primaryColor}
                                    onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                                    pattern="^#[0-9A-Fa-f]{6}$"
                                    className="w-32 font-mono"
                                    placeholder="#2E75B6"
                                />
                                <div
                                    className="size-6 rounded-full border border-border"
                                    style={{ backgroundColor: form.primaryColor }}
                                />
                            </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between">
                            {settings && (
                                <a
                                    href={`/${settings.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                                >
                                    <ExternalLink className="size-4" />
                                    Открыть страницу записи
                                </a>
                            )}
                            <Button type="submit" disabled={saving || uploadingLogo} className="ml-auto">
                                {saving ? "Сохраняем..." : "Сохранить"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Встраиваемый виджет</CardTitle>
                    <CardDescription>
                        Вставьте этот код на любую страницу вашего сайта — пациенты смогут записаться,
                        не покидая ваш сайт
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Preview */}
                    {settings && (
                        <div className="rounded-xl border border-border overflow-hidden bg-muted/30">
                            <div className="px-3 py-1.5 border-b border-border bg-muted flex items-center gap-1.5">
                                <div className="size-2.5 rounded-full bg-red-400" />
                                <div className="size-2.5 rounded-full bg-yellow-400" />
                                <div className="size-2.5 rounded-full bg-green-400" />
                                <span className="text-xs text-muted-foreground ml-2 truncate">{widgetUrl}</span>
                            </div>
                            <iframe
                                src={widgetUrl}
                                className="w-full"
                                style={{ height: 400, border: "none" }}
                                title="Widget preview"
                            />
                        </div>
                    )}

                    <div className="relative">
            <pre className="bg-muted rounded-xl p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
              {widgetCode}
            </pre>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={copyWidget}
                            className="absolute top-3 right-3 gap-1.5"
                        >
                            {copied ? (
                                <>
                                    <Check className="size-3.5 text-emerald-500" />
                                    Скопировано
                                </>
                            ) : (
                                <>
                                    <Copy className="size-3.5" />
                                    Копировать
                                </>
                            )}
                        </Button>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Виджет автоматически подстраивает высоту под содержимое. Цвет кнопок соответствует
                        выбранному цвету бренда.
                    </p>
                </CardContent>
            </Card>

            {settings && (
                <Card>
                    <CardHeader>
                        <CardTitle>Ваш адрес страницы</CardTitle>
                        <CardDescription>Поделитесь этой ссылкой с пациентами</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3">
              <span className="text-sm font-medium flex-1 truncate">
                {APP_URL}/{settings.slug}
              </span>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(`${APP_URL}/${settings.slug}`);
                                    toast("Ссылка скопирована", "success");
                                }}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Copy className="size-4" />
                            </button>
                            <a
                                href={`/${settings.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ExternalLink className="size-4" />
                            </a>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}