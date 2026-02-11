"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HomeIcon, SwordIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";

export default function NotFound() {
  const { t } = useI18n();

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-20">
      <div className="relative z-10 mx-auto max-w-2xl text-center">
        {/* Large 404 */}
        <div className="mb-8">
          <h1 className="text-9xl font-black tracking-tighter md:text-[12rem] text-primary">
            404
          </h1>
        </div>

        {/* Error message with LoL theme */}
        <div className="mb-8">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            {t("notFound.championNotFound")}
          </h2>
          <p className="text-lg text-muted-foreground md:text-xl">
            {t("notFound.pageEliminated")}
          </p>
        </div>

        {/* Decorative divider */}
        <div className="mb-12 flex items-center justify-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          <SwordIcon className="size-6 text-muted-foreground" />
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button size="lg" className="text-lg" asChild>
            <Link href="/">
              <HomeIcon className="mr-2 size-5" />
              {t("notFound.backHome")}
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="text-lg" asChild>
            <Link href="/compositions/create">
              <SwordIcon className="mr-2 size-5" />
              {t("notFound.createComposition")}
            </Link>
          </Button>
        </div>

        {/* Fun message */}
        <div className="mt-16 rounded-lg border bg-card/50 p-6 backdrop-blur-sm">
          <p className="text-sm text-muted-foreground">
            💡 <span className="font-medium">{t("notFound.tip")}</span>{" "}
            {t("notFound.maybeLookingFor")}{" "}
            <Link
              href="/tier-list/champions"
              className="font-medium text-primary hover:underline"
            >
              {t("notFound.champions")}
            </Link>{" "}
            {t("notFound.or")}{" "}
            <Link
              href="/tier-list/items"
              className="font-medium text-primary hover:underline"
            >
              {t("notFound.items")}
            </Link>{" "}
            {t("notFound.mostPowerfulMoment")}
          </p>
        </div>
      </div>
    </div>
  );
}
