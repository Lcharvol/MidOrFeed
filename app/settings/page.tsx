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
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  HomeIcon,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useSWRConfig } from "swr";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();
  const { user, logout } = useAuth();
  const { cache, mutate } = useSWRConfig();
  const [mounted, setMounted] = useState(false);
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

  const handleNotificationsToggle = () => {
    toast.info(t("settings.comingSoon"));
  };

  const handleClearCache = async () => {
    setLoading(true);
    try {
      // Clear SWR cache: revalidate all keys
      await mutate(() => true, undefined, { revalidate: true });
      toast.success(t("settings.cacheCleared"));
    } catch {
      toast.error(t("settings.cacheError"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    toast.info(t("settings.deleteAccountComingSoon"));
  };

  return (
    <div className="container mx-auto py-6 sm:py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">
                  <HomeIcon className="size-4" />
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t("settings.title")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

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
              <div className="p-2 rounded-md bg-primary/10">
                {mounted && theme === "dark" ? (
                  <MoonIcon className="size-4 text-primary" />
                ) : (
                  <SunIcon className="size-4 text-primary" />
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
              <RadioGroup
                value={mounted ? theme : undefined}
                onValueChange={handleThemeChange}
                className="flex gap-2"
              >
                <label
                  className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    mounted && theme === "light"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <RadioGroupItem value="light" className="sr-only" />
                  <SunIcon className="size-4" />
                  {t("settings.light")}
                </label>
                <label
                  className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    mounted && theme === "dark"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <RadioGroupItem value="dark" className="sr-only" />
                  <MoonIcon className="size-4" />
                  {t("settings.dark")}
                </label>
              </RadioGroup>
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
              <RadioGroup
                value={locale}
                onValueChange={(value) => handleLanguageChange(value as "fr" | "en")}
                className="flex gap-2"
              >
                <label
                  className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    locale === "fr"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <RadioGroupItem value="fr" className="sr-only" />
                  <GlobeIcon className="size-4" />
                  Français
                </label>
                <label
                  className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    locale === "en"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <RadioGroupItem value="en" className="sr-only" />
                  <GlobeIcon className="size-4" />
                  English
                </label>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-md bg-info-muted">
                <BellIcon className="size-4 text-info" />
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
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium">
                    {t("settings.pushNotifications")}
                  </h3>
                  <Badge variant="secondary" className="text-[10px]">{t("settings.comingSoon")}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("settings.receiveNotifications")}
                </p>
              </div>
              <Switch disabled />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium">
                    {t("settings.matchAlerts")}
                  </h3>
                  <Badge variant="secondary" className="text-[10px]">{t("settings.comingSoon")}</Badge>
                </div>
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
              <div className="p-2 rounded-md bg-success-muted">
                <ShieldIcon className="size-4 text-success" />
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
              <div className="p-2 rounded-md bg-warning-muted">
                <DatabaseIcon className="size-4 text-warning" />
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
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium">
                    {t("settings.exportData")}
                  </h3>
                  <Badge variant="secondary" className="text-[10px]">{t("settings.comingSoon")}</Badge>
                </div>
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
        <Card className="border-danger/20 bg-danger-muted">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-md bg-danger/20">
                <Trash2Icon className="size-4 text-danger" />
              </div>
              <CardTitle className="text-danger">
                {t("settings.dangerZone")}
              </CardTitle>
            </div>
            <CardDescription className="text-danger-muted-foreground">
              {t("settings.irreversibleActions")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-medium text-danger">
                  {t("settings.deleteAccount")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("settings.permanentlyDeleteAccount")}
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Trash2Icon className="size-4" />
                    {t("settings.delete")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("settings.deleteAccount")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("settings.deleteAccountConfirmation")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      {t("settings.delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
