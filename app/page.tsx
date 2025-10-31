"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrophyIcon,
  TrendingUpIcon,
  UsersIcon,
  ZapIcon,
  ShieldIcon,
  SwordIcon,
  BookIcon,
  BarChart3Icon,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-muted/50 to-background py-20 md:py-32">
        <div className="relative z-10 px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-6" variant="secondary">
              League of Legends
            </Badge>
            <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-7xl">
              Créez la composition
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {" "}
                parfaite
              </span>
            </h1>
            <p className="mb-8 text-xl text-muted-foreground md:text-2xl">
              Explorez les statistiques, analysez les meta et développez vos
              stratégies pour dominer la Faille
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="text-lg" asChild>
                <Link href="/tier-list/champions">
                  Voir les Champions
                  <ZapIcon className="ml-2 size-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg" asChild>
                <Link href="/tier-list/items">
                  Explorer les Items
                  <SwordIcon className="ml-2 size-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative background elements */}
        <div className="absolute inset-0 -z-0">
          <div className="absolute left-1/4 top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute right-1/4 bottom-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="px-20">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Toutes les fonctionnalités pour performer
            </h2>
            <p className="text-lg text-muted-foreground">
              Un outil complet pour analyser, créer et optimiser vos
              compositions
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="group transition-all hover:border-primary/50 hover:shadow-lg">
              <CardHeader>
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <TrophyIcon className="size-6 text-primary" />
                </div>
                <CardTitle>Tier Lists Actuelles</CardTitle>
                <CardDescription>
                  Consultez les classements en temps réel basés sur les
                  dernières données de jeu
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group transition-all hover:border-primary/50 hover:shadow-lg">
              <CardHeader>
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <TrendingUpIcon className="size-6 text-primary" />
                </div>
                <CardTitle>Méta Analyse</CardTitle>
                <CardDescription>
                  Identifiez les picks les plus performants et les tendances
                  actuelles
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group transition-all hover:border-primary/50 hover:shadow-lg">
              <CardHeader>
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <ShieldIcon className="size-6 text-primary" />
                </div>
                <CardTitle>Statistiques Détaillées</CardTitle>
                <CardDescription>
                  Accédez à toutes les données de chaque champion et objet du
                  jeu
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group transition-all hover:border-primary/50 hover:shadow-lg">
              <CardHeader>
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <BarChart3Icon className="size-6 text-primary" />
                </div>
                <CardTitle>Comparaisons</CardTitle>
                <CardDescription>
                  Comparez les forces et faiblesses de différentes compositions
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group transition-all hover:border-primary/50 hover:shadow-lg">
              <CardHeader>
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <BookIcon className="size-6 text-primary" />
                </div>
                <CardTitle>Guides Stratégiques</CardTitle>
                <CardDescription>
                  Apprenez les meilleures pratiques et optimisez votre gameplay
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group transition-all hover:border-primary/50 hover:shadow-lg">
              <CardHeader>
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <UsersIcon className="size-6 text-primary" />
                </div>
                <CardTitle>Communauté</CardTitle>
                <CardDescription>
                  Partagez vos compositions et inspirez-vous de celles des
                  autres
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/30 py-16">
        <div className="px-4">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">171</div>
              <div className="text-muted-foreground">Champions disponibles</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">635+</div>
              <div className="text-muted-foreground">Objets analysés</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">24/7</div>
              <div className="text-muted-foreground">Mise à jour continue</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Prêt à dominer la Faille ?
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Rejoignez la communauté et commencez à créer vos propres
              compositions gagnantes
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Créer un compte
                  <ZapIcon className="ml-2 size-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Se connecter</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
