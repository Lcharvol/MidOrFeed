import { Skeleton } from "@/components/ui/skeleton";

export default function GuideDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <Skeleton className="h-5 w-48" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}
