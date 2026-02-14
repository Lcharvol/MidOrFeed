"use client";

import { Suspense } from "react";
import { DraftBoard } from "./components/DraftBoard";
import { Skeleton } from "@/components/ui/skeleton";

function DraftPageFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-64 mx-auto" />
      <Skeleton className="h-6 w-96 mx-auto" />
      <Skeleton className="h-12 w-40 mx-auto" />
    </div>
  );
}

export default function DraftPage() {
  return (
    <main className="container max-w-6xl mx-auto px-4 py-6">
      <Suspense fallback={<DraftPageFallback />}>
        <DraftBoard />
      </Suspense>
    </main>
  );
}
