import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        neutral: "bg-[var(--color-surface-subtle)] text-[var(--color-ink-muted)]",
        accent: "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]",
        success: "bg-[var(--color-success-subtle)] text-[var(--color-success)]",
        warning: "bg-[var(--color-warning-subtle)] text-[var(--color-warning)]",
        danger: "bg-[var(--color-danger-subtle)] text-[var(--color-danger)]",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
