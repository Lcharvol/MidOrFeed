import { Skeleton } from "@/components/ui/skeleton";

export default function AIAnalysisLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Skeleton className="h-5 w-32" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-[600px] w-full rounded-xl" />
    </div>
  );
}
