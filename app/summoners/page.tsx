import { Suspense } from "react";
import SummonersLoading from "./loading";
import SummonersPageClient from "./SummonersPageClient";

export default function SummonersPage() {
  return (
    <Suspense fallback={<SummonersLoading />}>
      <SummonersPageClient />
    </Suspense>
  );
}
