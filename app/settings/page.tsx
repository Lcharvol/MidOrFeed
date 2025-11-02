"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  SettingsIcon,
  MoonIcon,
  SunIcon,
  GlobeIcon,
  BellIcon,
  ShieldIcon,
  DatabaseIcon,
  RefreshCwIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [loading, setLoading] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    toast.success(`Thème ${newTheme === "dark" ? "sombre" : "clair"} activé`);
  };

  const handleNotificationsToggle = (checked: boolean) => {
    setNotifications(checked);
    toast.success(`Notifications ${checked ? "activées" : "désactivées"}`);
  };

  const handleClearCache = async () => {
    setLoading(true);
    try {
      // Simuler une suppression de cache
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Cache vidé avec succès");
    } catch (error) {
      toast.error("Erreur lors de la suppression du cache");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        "⚠️ Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible."
      )
    ) {
      return;
    }

    toast.info("Fonctionnalité de suppression de compte à venir");
  };

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <SettingsIcon className="size-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Paramètres</h1>
          </div>
          <p className="text-muted-foreground">
            Gérez vos préférences et les paramètres de votre compte
          </p>
        </div>

        {/* Apparence */}
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-md bg-purple-500/10">
                {mounted && theme === "dark" ? (
                  <MoonIcon className="size-4 text-purple-600 dark:text-purple-400" />
                ) : (
                  <SunIcon className="size-4 text-purple-600 dark:text-purple-400" />
                )}
              </div>
              <CardTitle>Apparence</CardTitle>
            </div>
            <CardDescription>
              Personnalisez l&apos;apparence de l&apos;application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-medium">Thème</h3>
                <p className="text-sm text-muted-foreground">
                  Choisissez un thème clair ou sombre
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={mounted && theme === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleThemeChange("light")}
                  className="flex items-center gap-2"
                >
                  <SunIcon className="size-4" />
                  Clair
                </Button>
                <Button
                  variant={mounted && theme === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleThemeChange("dark")}
                  className="flex items-center gap-2"
                >
                  <MoonIcon className="size-4" />
                  Sombre
                </Button>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-medium">Langue</h3>
                <p className="text-sm text-muted-foreground">
                  Langue de l&apos;interface
                </p>
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                <GlobeIcon className="size-3" />
                Français (FR)
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-md bg-blue-500/10">
                <BellIcon className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>
              Gérez vos préférences de notification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-medium">Notifications push</h3>
                <p className="text-sm text-muted-foreground">
                  Recevez des notifications sur vos performances
                </p>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={handleNotificationsToggle}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-medium">Alertes de match</h3>
                <p className="text-sm text-muted-foreground">
                  Notifications pour vos matchs récents
                </p>
              </div>
              <Switch disabled />
            </div>
          </CardContent>
        </Card>

        {/* Confidentialité */}
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-md bg-green-500/10">
                <ShieldIcon className="size-4 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>Confidentialité</CardTitle>
            </div>
            <CardDescription>
              Contrôlez vos données et votre vie privée
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-medium">Profil public</h3>
                <p className="text-sm text-muted-foreground">
                  Votre profil est actuellement privé
                </p>
              </div>
              <Badge variant="secondary">Privé</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-medium">Partage de données</h3>
                <p className="text-sm text-muted-foreground">
                  Contribuer à améliorer l&apos;application
                </p>
              </div>
              <Switch disabled />
            </div>
          </CardContent>
        </Card>

        {/* Données */}
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-md bg-orange-500/10">
                <DatabaseIcon className="size-4 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle>Données</CardTitle>
            </div>
            <CardDescription>Gérez votre cache et vos données</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-medium">Cache</h3>
                <p className="text-sm text-muted-foreground">
                  Videz le cache pour libérer de l&apos;espace
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCache}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <RefreshCwIcon className="size-4 animate-spin" />
                ) : (
                  <RefreshCwIcon className="size-4" />
                )}
                Vider
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-medium">Exporter mes données</h3>
                <p className="text-sm text-muted-foreground">
                  Téléchargez une copie de vos données
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Exporter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Zone de danger */}
        <Card className="border-red-500/20 bg-red-500/5">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-md bg-red-500/20">
                <Trash2Icon className="size-4 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-red-600 dark:text-red-400">
                Zone de danger
              </CardTitle>
            </div>
            <CardDescription className="text-red-600/70 dark:text-red-400/70">
              Actions irréversibles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-medium text-red-600 dark:text-red-400">
                  Supprimer mon compte
                </h3>
                <p className="text-sm text-muted-foreground">
                  Supprime définitivement votre compte et toutes vos données
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteAccount}
                className="flex items-center gap-2"
              >
                <Trash2Icon className="size-4" />
                Supprimer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
