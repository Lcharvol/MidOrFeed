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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PaletteIcon,
  KeyIcon,
  GlobeIcon,
  Loader2Icon,
  CheckIcon,
  AlertCircleIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useI18n } from "@/lib/i18n-context";
import { toast } from "sonner";

export function SettingsTab() {
  const { theme, setTheme } = useTheme();
  const { t, locale, setLocale } = useI18n();

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(t("profile.settings.passwordsMismatch"));
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError(t("profile.settings.passwordTooShort"));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(t("profile.settings.passwordChanged"));
        setIsChangingPassword(false);
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setPasswordError(result.error || t("profile.settings.passwordChangeError"));
      }
    } catch (error) {
      setPasswordError(t("profile.settings.connectionError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PaletteIcon className="size-5 text-primary" />
            {t("profile.settings.appearance")}
          </CardTitle>
          <CardDescription>
            {t("profile.settings.appearanceDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t("profile.settings.theme")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("profile.settings.themeDescription")}
              </p>
            </div>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t("profile.settings.light")}</SelectItem>
                <SelectItem value="dark">{t("profile.settings.dark")}</SelectItem>
                <SelectItem value="system">{t("profile.settings.system")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GlobeIcon className="size-5 text-primary" />
            {t("profile.settings.language")}
          </CardTitle>
          <CardDescription>
            {t("profile.settings.languageDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t("profile.settings.interfaceLanguage")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("profile.settings.interfaceLanguageDescription")}
              </p>
            </div>
            <Select value={locale} onValueChange={setLocale}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyIcon className="size-5 text-primary" />
            {t("profile.settings.security")}
          </CardTitle>
          <CardDescription>
            {t("profile.settings.securityDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isChangingPassword ? (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("profile.settings.password")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("profile.settings.passwordDescription")}
                </p>
              </div>
              <Button variant="outline" onClick={() => setIsChangingPassword(true)}>
                {t("profile.settings.changePassword")}
              </Button>
            </div>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">{t("profile.settings.currentPassword")}</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t("profile.settings.newPassword")}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("profile.settings.confirmPassword")}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              {passwordError && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircleIcon className="size-4" />
                  {passwordError}
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2Icon className="mr-2 size-4 animate-spin" />
                      {t("profile.settings.saving")}
                    </>
                  ) : (
                    <>
                      <CheckIcon className="mr-2 size-4" />
                      {t("profile.settings.savePassword")}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordError(null);
                    setPasswordForm({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                  }}
                  disabled={isSubmitting}
                >
                  {t("profile.settings.cancelPassword")}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
