"use client";

import { useAuth } from "@/lib/auth-context";
import { ProfileHeader } from "./ProfileHeader";
import { AccountTab } from "./AccountTab";
import { StatsTab } from "./StatsTab";
import { SettingsTab } from "./SettingsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserIcon, BarChart3Icon, SettingsIcon, Loader2Icon } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const { t } = useI18n();

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center py-20">
          <Loader2Icon className="size-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-10">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-4 text-3xl font-bold">Connexion requise</h1>
          <p className="text-muted-foreground">
            Vous devez être connecté pour accéder à votre profil.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 sm:py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <ProfileHeader user={user} />

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="account" className="flex-1 sm:flex-none">
              <UserIcon className="size-4" />
              <span className="hidden sm:inline">Compte</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex-1 sm:flex-none">
              <BarChart3Icon className="size-4" />
              <span className="hidden sm:inline">Statistiques</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 sm:flex-none">
              <SettingsIcon className="size-4" />
              <span className="hidden sm:inline">Paramètres</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <AccountTab user={user} />
          </TabsContent>

          <TabsContent value="stats">
            <StatsTab user={user} />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
