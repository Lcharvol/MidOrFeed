import { Skeleton } from "@/components/ui/skeleton";

export default function DraftLoading() {
  return (
    <main className="container max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-col items-center gap-6 py-16">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-12 w-48" />
      </div>
    </main>
  );
}
