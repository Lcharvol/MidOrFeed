import { Skeleton } from "@/components/ui/skeleton";

export default function DownloadLoading() {
  return (
    <div className="container mx-auto py-20 px-4">
      <Skeleton className="h-5 w-40 mb-8" />
      <div className="text-center mb-16 space-y-4">
        <Skeleton className="h-12 w-80 mx-auto" />
        <Skeleton className="h-6 w-96 mx-auto" />
      </div>
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-[200px] rounded-xl" />
        <div className="grid sm:grid-cols-2 gap-4">
          <Skeleton className="h-[120px] rounded-xl" />
          <Skeleton className="h-[120px] rounded-xl" />
        </div>
      </div>
    </div>
  );
}
