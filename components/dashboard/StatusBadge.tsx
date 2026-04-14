import { Badge } from "@/components/ui/badge";

const STATUS_MAP = {
    PENDING:              { label: "Ожидает",    variant: "warning"     },
    CONFIRMED:            { label: "Подтверждена", variant: "success"   },
    CANCELLED_BY_PATIENT: { label: "Отменена (пациент)", variant: "secondary" },
    CANCELLED_BY_CLINIC:  { label: "Отменена (клиника)", variant: "secondary" },
    COMPLETED:            { label: "Завершена",  variant: "default"     },
    NO_SHOW:              { label: "Не явился",  variant: "destructive" },
} as const;

export function StatusBadge({ status }: { status: string }) {
    const s = STATUS_MAP[status as keyof typeof STATUS_MAP] ?? { label: status, variant: "outline" as const };
    return <Badge variant={s.variant as never}>{s.label}</Badge>;
}