"use client";

import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LinkIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";

export function LinkRiotAccountCard() {
  const { t } = useI18n();

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center text-center">
        <LinkIcon className="size-10 text-muted-foreground/50 mb-3" />
        <h3 className="text-lg font-semibold mb-2">
          {t("summoners.linkRiotAccountTitle")}
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mb-4">
          {t("summoners.linkRiotAccountDescription")}
        </p>
        <Button variant="outline" asChild>
          <Link href="/profile">{t("summoners.linkRiotAccountAction")}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
