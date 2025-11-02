"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HomeIcon, SwordIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";

export default function NotFound() {
  const { t } = useI18n();

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-20">
      {/* Decorative background elements */}
      <div className="absolute inset-0 -z-0">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-destructive/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl text-center">
        {/* Large 404 with gradient */}
        <div className="mb-8">
          <h1 className="text-9xl font-black tracking-tighter md:text-[12rem]">
            <span className="bg-gradient-to-r from-primary via-primary/80 to-destructive bg-clip-text text-transparent">
              404
            </span>
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
          <SwordIcon className="size-6 text-primary" />
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
