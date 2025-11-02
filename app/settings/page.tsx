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
import { useI18n } from "@/lib/i18n-context";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();
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
    toast.success(
      t(`settings.theme${newTheme === "dark" ? "Dark" : "Light"}Activated`)
    );
  };

  const handleLanguageChange = (newLocale: "fr" | "en") => {
    setLocale(newLocale);
    toast.success(t("settings.languageChanged"));
  };

  const handleNotificationsToggle = (checked: boolean) => {
    setNotifications(checked);
    toast.success(
      t(`settings.notifications${checked ? "Enabled" : "Disabled"}`)
    );
  };

  const handleClearCache = async () => {
    setLoading(true);
    try {
      // Simuler une suppression de cache
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(t("settings.cacheCleared"));
    } catch (error) {
      toast.error(t("settings.cacheError"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm(t("settings.deleteAccountConfirmation"))) {
      return;
    }

    toast.info(t("settings.deleteAccountComingSoon"));
  };

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <SettingsIcon className="size-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">{t("settings.title")}</h1>
          </div>
          <p className="text-muted-foreground">{t("settings.subtitle")}</p>
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
              <CardTitle>{t("settings.appearance")}</CardTitle>
            </div>
            <CardDescription>
              {t("settings.appearanceDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-medium">{t("settings.theme")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("settings.chooseTheme")}
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
                  {t("settings.light")}
                </Button>
                <Button
                  variant={mounted && theme === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleThemeChange("dark")}
                  className="flex items-center gap-2"
                >
                  <MoonIcon className="size-4" />
                  {t("settings.dark")}
                </Button>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-medium">
                  {t("settings.language")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("settings.interfaceLanguage")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={locale === "fr" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleLanguageChange("fr")}
                  className="flex items-center gap-2"
                >
                  <GlobeIcon className="size-4" />
                  Français
                </Button>
                <Button
                  variant={locale === "en" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleLanguageChange("en")}
                  className="flex items-center gap-2"
                >
                  <GlobeIcon className="size-4" />
                  English
                </Button>
              </div>
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
              <CardTitle>{t("settings.notifications")}</CardTitle>
            </div>
            <CardDescription>
              {t("settings.manageNotifications")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-medium">
                  {t("settings.pushNotifications")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("settings.receiveNotifications")}
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
                <h3 className="text-sm font-medium">
                  {t("settings.matchAlerts")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("settings.recentMatchNotifications")}
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
              <CardTitle>{t("settings.privacy")}</CardTitle>
            </div>
            <CardDescription>{t("settings.controlData")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-medium">
                  {t("settings.publicProfile")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("settings.profileCurrentlyPrivate")}
                </p>
              </div>
              <Badge variant="secondary">{t("settings.private")}</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-medium">
                  {t("settings.dataSharing")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("settings.contributeToImprove")}
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
              <CardTitle>{t("settings.data")}</CardTitle>
            </div>
            <CardDescription>{t("settings.manageCache")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-medium">{t("settings.cache")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("settings.clearCache")}
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
                {t("settings.clear")}
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-medium">
                  {t("settings.exportData")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("settings.downloadDataCopy")}
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                {t("settings.export")}
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
                {t("settings.dangerZone")}
              </CardTitle>
            </div>
            <CardDescription className="text-red-600/70 dark:text-red-400/70">
              {t("settings.irreversibleActions")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-medium text-red-600 dark:text-red-400">
                  {t("settings.deleteAccount")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("settings.permanentlyDeleteAccount")}
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteAccount}
                className="flex items-center gap-2"
              >
                <Trash2Icon className="size-4" />
                {t("settings.delete")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
