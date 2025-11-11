"use client";

import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import {
  Loader2Icon,
  InfoIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  XCircleIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DataStateTone = "neutral" | "info" | "success" | "warning" | "danger";
type DataStateVariant = "card" | "plain";

type DataStateProps = {
  tone?: DataStateTone;
  variant?: DataStateVariant;
  title?: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  isLoading?: boolean;
  className?: string;
  containerClassName?: string;
} & Omit<ComponentPropsWithoutRef<"div">, "title">;

const toneClasses: Record<DataStateTone, string> = {
  neutral: "border-border/40 bg-muted/30 text-muted-foreground",
  info: "border-primary/30 bg-primary/5 text-primary",
  success:
    "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-300",
  warning:
    "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-300",
  danger: "border-red-500/30 bg-red-500/5 text-red-600 dark:text-red-300",
};

const toneIcons: Record<DataStateTone, ReactNode> = {
  neutral: <InfoIcon className="size-5" />,
  info: <InfoIcon className="size-5" />,
  success: <CheckCircle2Icon className="size-5" />,
  warning: <AlertTriangleIcon className="size-5" />,
  danger: <XCircleIcon className="size-5" />,
};

export const DataState = forwardRef<HTMLDivElement, DataStateProps>(
  (
    {
      tone = "neutral",
      variant = "card",
      title,
      description,
      action,
      icon,
      isLoading = false,
      className,
      containerClassName,
      children,
      ...props
    },
    ref
  ) => {
    const resolvedIcon = isLoading ? (
      <Loader2Icon className="size-5 animate-spin" />
    ) : (
      icon ?? toneIcons[tone]
    );

    if (variant === "plain") {
      return (
        <div
          ref={ref}
          className={cn(
            "flex flex-col items-center justify-center gap-3 text-center",
            containerClassName
          )}
          {...props}
        >
          {resolvedIcon}
          {title && <p className="text-base font-semibold">{title}</p>}
          {description && (
            <p className="max-w-md text-sm text-muted-foreground">
              {description}
            </p>
          )}
          {children}
          {action}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn("flex justify-center", containerClassName)}
        {...props}
      >
        <Card
          className={cn(
            "w-full max-w-lg border shadow-sm",
            toneClasses[tone],
            className
          )}
        >
          <CardHeader className="flex flex-row items-start gap-3">
            <div className="mt-1">{resolvedIcon}</div>
            <div className="space-y-2">
              {title && <CardTitle>{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </div>
          </CardHeader>
          {(children || action) && (
            <CardContent className="space-y-4">
              {children}
              {action}
            </CardContent>
          )}
        </Card>
      </div>
    );
  }
);

DataState.displayName = "DataState";
