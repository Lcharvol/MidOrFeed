"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { RiotAccountSection } from "@/app/profile/RiotAccountSection";
import { useRiotAccountForm } from "@/lib/hooks/use-riot-account-form";

export default function SummonersPage() {
  const router = useRouter();
  const { user, login } = useAuth();

  // Gestion du formulaire Riot (toujours appelé pour respecter les règles des hooks)
  const {
    form,
    isSaving,
    isAnalyzing,
    isEditing,
    handleSaveAccount,
    handleEditAccount,
    handleCancelEdit,
    handleAnalyzeMatches,
  } = useRiotAccountForm({
    user,
    login: login as (user: unknown) => void,
  });

  useEffect(() => {
    if (user?.leagueAccount?.puuid && user?.leagueAccount?.riotRegion) {
      router.replace(
        `/summoners/${user.leagueAccount.puuid}/overview?region=${user.leagueAccount.riotRegion}`
      );
    }
  }, [router, user?.leagueAccount?.puuid, user?.leagueAccount?.riotRegion]);

  // If not linked to a League account, show the Riot account form reused from profile
  if (!user?.leagueAccount) {
    return (
      <div className="container mx-auto py-10">
        <RiotAccountSection
          user={null}
          form={form}
          isSaving={isSaving}
          isAnalyzing={isAnalyzing}
          isEditing={isEditing}
          onSave={handleSaveAccount}
          onEdit={handleEditAccount}
          onCancelEdit={handleCancelEdit}
          onAnalyzeMatches={handleAnalyzeMatches}
        />
      </div>
    );
  }

  return null;
}
