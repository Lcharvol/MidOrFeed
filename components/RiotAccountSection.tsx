"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Gamepad2Icon,
  Loader2Icon,
  TrendingUpIcon,
  EditIcon,
  XIcon,
  Trash2Icon,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/lib/auth-context";
import { useRiotAccountForm } from "@/lib/hooks/use-riot-account-form";
import { RIOT_REGIONS } from "@/lib/riot-regions";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

export interface RiotAccountSectionProps {
  className?: string;
  showAnalyzeButton?: boolean;
}

export const RiotAccountSection = ({
  className,
  showAnalyzeButton = true,
}: RiotAccountSectionProps) => {
  const { t } = useI18n();
  const { user, login } = useAuth();

  const {
    form,
    isSaving,
    isAnalyzing,
    isEditing,
    isDeleting,
    showDeleteConfirm,
    setShowDeleteConfirm,
    handleSaveAccount,
    handleEditAccount,
    handleCancelEdit,
    handleAnalyzeMatches,
    handleDeleteAccount,
    confirmDeleteAccount,
  } = useRiotAccountForm({
    user,
    login,
  });

  const accountDisplay = useMemo(() => {
    if (!user) return null;
    const gameName = user.leagueAccount?.riotGameName ?? user.riotGameName;
    const tagLine = user.leagueAccount?.riotTagLine ?? user.riotTagLine;
    const region = user.leagueAccount?.riotRegion ?? user.riotRegion;

    if (!gameName) return null;

    return {
      gameName,
      tagLine,
      region,
    };
  }, [user]);

  if (!user) {
    return null;
  }

  return (
    <>
      <Card className={cn("mt-6", className)}>
        <CardHeader>
          <CardTitle>{t("profile.riotAccount")}</CardTitle>
          <CardDescription>{t("profile.connectRiot")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {accountDisplay && !isEditing ? (
            <>
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gamepad2Icon className="size-5 text-primary" />
                    <span className="font-semibold">
                      {accountDisplay.gameName}
                      {accountDisplay.tagLine && `#${accountDisplay.tagLine}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleEditAccount}
                      title={t("profile.editAccount")}
                    >
                      <EditIcon className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      title={t("profile.deleteAccount")}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      {isDeleting ? (
                        <Loader2Icon className="size-4 animate-spin" />
                      ) : (
                        <Trash2Icon className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("profile.region")} :{" "}
                  {accountDisplay.region?.toUpperCase() ?? "—"}
                </p>
              </div>

              {showAnalyzeButton && (
                <Button
                  onClick={handleAnalyzeMatches}
                  disabled={isAnalyzing}
                  className="w-full"
                  variant="outline"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2Icon className="mr-2 size-4 animate-spin" />
                      {t("profile.analyzing")}
                    </>
                  ) : (
                    <>
                      <TrendingUpIcon className="mr-2 size-4" />
                      {t("profile.analyzeMatches")}
                    </>
                  )}
                </Button>
              )}
            </>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSaveAccount)}
                className="space-y-4"
              >
                {isEditing && (
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      {t("profile.editAccount")}
                    </h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleCancelEdit}
                    >
                      <XIcon className="size-4" />
                    </Button>
                  </div>
                )}
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="gameName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("profile.gameName")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("profile.gameName")}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Votre nom in-game</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tagLine"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("profile.tagLine")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("profile.tagLine")}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Format : GOD#1234</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("profile.region")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("profile.region")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {RIOT_REGIONS.map((regionOption) => (
                              <SelectItem
                                key={regionOption.value}
                                value={regionOption.value}
                              >
                                {regionOption.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Sélectionnez votre région de jeu
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isSaving} className="flex-1">
                    {isSaving ? (
                      <>
                        <Loader2Icon className="mr-2 size-4 animate-spin" />
                        {t("profile.saving")}
                      </>
                    ) : isEditing ? (
                      t("profile.updateAccount")
                    ) : (
                      t("profile.saveAccount")
                    )}
                  </Button>
                  {isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                    >
                      {t("profile.cancel")}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      {/* Modal de confirmation de suppression */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("profile.deleteAccount")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("profile.deleteAccountConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t("profile.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                  {t("profile.saving")}
                </>
              ) : (
                t("profile.deleteAccount")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
