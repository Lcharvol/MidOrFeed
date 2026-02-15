import { Skeleton } from "@/components/ui/skeleton";

export default function CreateGuideLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96" />
      </div>
      <Skeleton className="h-[500px] w-full rounded-xl" />
    </div>
  );
}
