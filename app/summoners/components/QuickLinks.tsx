"use client";

import { Button } from "@/components/ui/button";
import { TrophyIcon, BarChart3Icon, SwordsIcon } from "lucide-react";
import Link from "next/link";

export function QuickLinks() {
  return (
    <div className="flex flex-wrap gap-3 justify-center pt-4">
      <Button variant="outline" asChild>
        <Link href="/leaderboard">
          <TrophyIcon className="size-4 mr-2" />
          Classement
        </Link>
      </Button>
      <Button variant="outline" asChild>
        <Link href="/tier-list/champions">
          <BarChart3Icon className="size-4 mr-2" />
          Tier List
        </Link>
      </Button>
      <Button variant="outline" asChild>
        <Link href="/champions">
          <SwordsIcon className="size-4 mr-2" />
          Champions
        </Link>
      </Button>
    </div>
  );
}
