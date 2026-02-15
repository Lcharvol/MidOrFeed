import { Skeleton } from "@/components/ui/skeleton";

export default function LoginLoading() {
  return (
    <div className="container mx-auto py-20 px-4">
      <div className="max-w-md mx-auto space-y-6">
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    </div>
  );
}
