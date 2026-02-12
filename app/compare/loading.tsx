import { Skeleton } from "@/components/ui/skeleton";

export default function CompareLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <Skeleton className="h-5 w-48" />
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-80" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
      </div>
      <Skeleton className="h-10 w-32 mx-auto" />
    </div>
  );
}
