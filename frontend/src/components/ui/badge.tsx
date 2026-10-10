import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 text-xs font-mono font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring shadow-sm",
  {
    variants: {
      variant: {
        default:
          "border-border bg-card-elevated text-foreground",
        secondary:
          "border-border bg-card text-sand font-medium",
        high:
          "border-burgundy bg-burgundy text-cream shadow-sm font-semibold",
        moderate:
          "border-brown-accent/40 bg-brown-surface text-brown-deep font-semibold",
        low:
          "border-border bg-card-elevated text-sand font-semibold",
        outline:
          "border-border text-foreground bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
