import { Skeleton } from "@/components/ui/skeleton";

export default function TierListLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <Skeleton className="h-5 w-48" />
      <div className="space-y-2">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-5 w-96" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-[500px] w-full rounded-xl" />
    </div>
  );
}
