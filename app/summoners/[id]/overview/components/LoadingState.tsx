"use client";

import { Loader2Icon } from "lucide-react";

export const LoadingState = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2Icon className="size-12 animate-spin text-muted-foreground" />
  </div>
);
