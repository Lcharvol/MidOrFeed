"use client";

import { useAuth } from "@/lib/auth-context";
import { ProfileInfo } from "./ProfileInfo";
import { RiotAccountSection } from "./RiotAccountSection";
import { useRiotAccountForm } from "@/lib/hooks/use-riot-account-form";

export default function ProfilePage() {
  const { user, login } = useAuth();

  // Gestion du formulaire Riot
  const {
    gameName,
    setGameName,
    tagLine,
    setTagLine,
    region,
    setRegion,
    isSaving,
    isAnalyzing,
    isEditing,
    handleSaveAccount,
    handleEditAccount,
    handleCancelEdit,
    handleAnalyzeMatches,
  } = useRiotAccountForm({ user, login });

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="mb-6 text-3xl font-bold">Mon Profil</h1>

        <ProfileInfo user={user} />

        <RiotAccountSection
          user={user}
          gameName={gameName}
          setGameName={setGameName}
          tagLine={tagLine}
          setTagLine={setTagLine}
          region={region}
          setRegion={setRegion}
          isSaving={isSaving}
          isAnalyzing={isAnalyzing}
          isEditing={isEditing}
          onSave={handleSaveAccount}
          onEdit={handleEditAccount}
          onCancelEdit={handleCancelEdit}
          onAnalyzeMatches={handleAnalyzeMatches}
        />
      </div>
    </div>
  );
}
