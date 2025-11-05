"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2Icon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: ReactNode;
  loading?: boolean;
  variant?: "default" | "green" | "amber";
}

const variantStyles = {
  default:
    "border-l-4 border-l-primary/50 bg-muted/30 hover:bg-muted/50 transition-colors",
  green:
    "border-l-4 border-l-green-500/50 bg-green-500/5 hover:bg-green-500/10 transition-colors",
  amber:
    "border-l-4 border-l-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10 transition-colors",
};

export function StatCard({
  title,
  value,
  description,
  icon,
  loading = false,
  variant = "default",
}: StatCardProps) {
  return (
    <Card className={`${variantStyles[variant]}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? (
            <Loader2Icon className="size-6 animate-spin" />
          ) : typeof value === "number" ? (
            value.toLocaleString()
          ) : (
            value
          )}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
