import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
    ({ className, ...props }, ref) => (
        <textarea
            ref={ref}
            className={cn(
                "flex min-h-[80px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm",
                "placeholder:text-muted-foreground resize-none",
                "focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring",
                "disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        />
    )
);
Textarea.displayName = "Textarea";

export { Textarea };