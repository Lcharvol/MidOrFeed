import { Suspense } from "react";
import SummonerProfileLoading from "../loading";
import SummonerOverviewClient from "./SummonerOverviewClient";

export default function SummonerOverviewPage() {
  return (
    <Suspense fallback={<SummonerProfileLoading />}>
      <SummonerOverviewClient />
    </Suspense>
  );
}
