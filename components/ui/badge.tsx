import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-primary/20 bg-primary/15 text-primary hover:bg-primary/20 dark:text-primary-300",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-red-500/20 bg-red-500/15 text-red-700 hover:bg-red-500/20 focus-visible:ring-red-500/20 dark:text-red-400",
        outline:
          "border border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground",
        info: "border-blue-500/20 bg-blue-500/15 text-blue-600 dark:text-blue-400",
        warning:
          "border-amber-500/20 bg-amber-500/15 text-amber-700 dark:text-amber-400",
        success:
          "border-emerald-500/20 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
