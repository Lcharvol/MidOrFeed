"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ConfigSection } from "./components/api-test/ConfigSection";
import { LiveGameSection } from "./components/api-test/LiveGameSection";
import { ServerStatusSection } from "./components/api-test/ServerStatusSection";
import { MasterySection } from "./components/api-test/MasterySection";

export const ApiTestTab = () => {
  const { user } = useAuth();

  const [region, setRegion] = useState(user?.riotRegion || "euw1");
  const [puuid, setPuuid] = useState(user?.riotPuuid || "");

  return (
    <div className="space-y-6">
      <ConfigSection
        region={region}
        setRegion={setRegion}
        puuid={puuid}
        setPuuid={setPuuid}
      />
      <LiveGameSection region={region} puuid={puuid} />
      <ServerStatusSection region={region} />
      <MasterySection region={region} puuid={puuid} />
    </div>
  );
};
