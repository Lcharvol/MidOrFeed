import { Skeleton } from "@/components/ui/skeleton";

export default function CounterPicksLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <Skeleton className="h-5 w-48" />
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96" />
      </div>
      <Skeleton className="h-14 w-full max-w-md rounded-xl" />
      <Skeleton className="h-[400px] w-full rounded-xl" />
    </div>
  );
}
