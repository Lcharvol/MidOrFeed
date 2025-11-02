"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckIcon,
  CrownIcon,
  Loader2Icon,
  XIcon,
  ZapIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpgrade = async (tier: "free" | "premium") => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (tier === "premium") {
      setIsProcessing(true);
      // TODO: Implémenter l'intégration de paiement (Stripe, etc.)

      // Simuler un paiement pour le moment
      setTimeout(() => {
        setIsProcessing(false);
        // TODO: Appeler l'API pour activer l'abonnement
        alert("Paiement simulé ! (À implémenter avec Stripe)");
      }, 1500);
    }
  };

  const isPremium = user?.subscriptionTier === "premium";

  return (
    <div className="container mx-auto py-20 px-4">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-4">Choisissez votre plan</h1>
        <p className="text-xl text-muted-foreground">
          Débloquez tout le potentiel de l'IA pour progresser plus rapidement
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Plan */}
        <Card className="border-2 relative">
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="size-16 rounded-full bg-muted flex items-center justify-center">
                <ZapIcon className="size-8 text-muted-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl">
              {t("subscription.freeTitle")}
            </CardTitle>
            <div className="my-4">
              <span className="text-5xl font-bold">
                {t("subscription.freePrice")}
              </span>
              <span className="text-muted-foreground">
                {" "}
                / {t("subscription.freePeriod")}
              </span>
            </div>
            <CardDescription>{t("subscription.freeLimit")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <CheckIcon className="size-5 text-green-500" />
                <span>3 analyses IA par jour</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-5 text-green-500" />
                <span>Statistiques de base</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-5 text-green-500" />
                <span>Accès aux tier lists</span>
              </li>
              <li className="flex items-center gap-2">
                <XIcon className="size-5 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Analyses illimitées
                </span>
              </li>
              <li className="flex items-center gap-2">
                <XIcon className="size-5 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Coaching IA personnalisé
                </span>
              </li>
              <li className="flex items-center gap-2">
                <XIcon className="size-5 text-muted-foreground" />
                <span className="text-muted-foreground">Assistant in-game</span>
              </li>
            </ul>
            <Button
              className="w-full"
              variant={isPremium ? "outline" : "default"}
              disabled
            >
              {isPremium ? "Actuel" : "Plan actuel"}
            </Button>
          </CardContent>
        </Card>

        {/* Premium Plan */}
        <Card className="border-2 border-primary relative">
          {isPremium && (
            <Badge
              className="absolute -top-3 left-1/2 -translate-x-1/2"
              variant="default"
            >
              {t("subscription.currentPlan")}
            </Badge>
          )}
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="size-16 rounded-full bg-primary/20 flex items-center justify-center">
                <CrownIcon className="size-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">
              {t("subscription.premiumTitle")}
            </CardTitle>
            <div className="my-4">
              <span className="text-5xl font-bold">
                {t("subscription.premiumPrice")}
              </span>
              <span className="text-muted-foreground">
                {" "}
                / {t("subscription.premiumPeriod")}
              </span>
            </div>
            <CardDescription>{t("subscription.premiumLimit")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <CheckIcon className="size-5 text-green-500" />
                <span>Analyses IA illimitées</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-5 text-green-500" />
                <span>Statistiques avancées</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-5 text-green-500" />
                <span>Tier lists & synergies</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-5 text-green-500" />
                <span>Coaching IA personnalisé</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-5 text-green-500" />
                <span>Assistant in-game temps réel</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-5 text-green-500" />
                <span>Suggestions de composition IA</span>
              </li>
            </ul>
            <Button
              className="w-full"
              variant={isPremium ? "outline" : "default"}
              onClick={() => handleUpgrade("premium")}
              disabled={isProcessing || isPremium}
            >
              {isProcessing ? (
                <>
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                  Traitement...
                </>
              ) : isPremium ? (
                "Abonnement actif"
              ) : (
                <>
                  {t("subscription.upgradeNow")}{" "}
                  <CrownIcon className="ml-2 size-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <div className="mt-20 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">
          Questions fréquentes
        </h2>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Puis-je changer de plan à tout moment ?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Oui, vous pouvez passer du plan gratuit au Premium à tout
                moment. L'abonnement Premium peut être annulé à tout moment sans
                engagement.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Quand sont réinitialisées mes analyses quotidiennes ?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Vos 3 analyses gratuites sont réinitialisées chaque jour à
                minuit UTC. Avec le plan Premium, vous avez accès à des analyses
                illimitées.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Y a-t-il un engagement à long terme ?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Non, l'abonnement Premium est mensuel et peut être annulé à tout
                moment. Vous conservez l'accès jusqu'à la fin de la période
                payée.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
