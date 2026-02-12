"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRightIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";

export const CTASection = () => {
  const { t } = useI18n();

  return (
    <section className="py-14 md:py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
            <CardContent className="p-10 text-center">
              <h2 className="mb-3 text-2xl font-bold md:text-3xl">
                {t("home.readyToImprove")}
              </h2>
              <p className="mb-6 text-muted-foreground">
                {t("home.joinAIRevolution")}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button size="lg" asChild>
                  <Link href="/signup">
                    {t("home.startFree")}
                    <ArrowRightIcon className="ml-2 size-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/login">{t("home.signIn")}</Link>
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">{t("home.noCreditCard")}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
