import { Skeleton } from "@/components/ui/skeleton";

export default function SummonersLoading() {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container relative mx-auto px-4 py-16 sm:py-24">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Skeleton className="h-12 w-80 mx-auto" />
            <Skeleton className="h-6 w-96 mx-auto" />
            <Skeleton className="h-32 w-full max-w-2xl mx-auto rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
