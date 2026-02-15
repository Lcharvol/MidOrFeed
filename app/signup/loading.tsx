import { Skeleton } from "@/components/ui/skeleton";

export default function SignupLoading() {
  return (
    <div className="container mx-auto py-20 px-4">
      <div className="max-w-md mx-auto space-y-6">
        <Skeleton className="h-[450px] rounded-xl" />
      </div>
    </div>
  );
}
