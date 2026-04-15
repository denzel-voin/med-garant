"use client";

import React, { useEffect, useState } from "react";
import { Copy, Check, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

interface TenantSettings {
    id: string;
    name: string;
    slug: string;
    email: string | null;
    address: string | null;
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
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetch("/api/v1/settings")
            .then((r) => r.json())
            .then((data: TenantSettings) => {
                setSettings(data);
                setForm({
                    name: data.name,
                    address: data.address ?? "",
                    phone: data.phone ?? "",
                    logo: data.logo ?? "",
                    primaryColor: data.primaryColor,
                });
            })
            .finally(() => setLoading(false));
    }, []);

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
                                <Input
                                    placeholder="ул. Ленина, 1"
                                    value={form.address}
                                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>URL логотипа</Label>
                            <Input
                                type="url"
                                placeholder="https://..."
                                value={form.logo}
                                onChange={(e) => setForm((f) => ({ ...f, logo: e.target.value }))}
                            />
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
                            <Button type="submit" disabled={saving} className="ml-auto">
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