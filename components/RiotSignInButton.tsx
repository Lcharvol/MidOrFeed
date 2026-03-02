"use client";

import { Loader2Icon } from "lucide-react";

import { useI18n } from "@/lib/i18n-context";
import { Button } from "@/components/ui/button";

function RiotIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path
        d="M12.534 21.77l-1.09-2.81 10.52.54-.451 4.5zM15.06 0L.307 6.969 2.59 17.471l2.86-.96L3.867 8.212l8.563-3.446 4.39 14.98 2.86-.96z"
        fill="#D32936"
      />
    </svg>
  );
}

interface RiotSignInButtonProps {
  disabled?: boolean;
}

export function RiotSignInButton({ disabled }: RiotSignInButtonProps) {
  const { t } = useI18n();

  const handleClick = () => {
    window.location.href = "/api/auth/riot";
  };

  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={handleClick}
      disabled={disabled}
    >
      {disabled ? (
        <Loader2Icon className="size-4 animate-spin" />
      ) : (
        <RiotIcon />
      )}
      {t("login.riotGames")}
    </Button>
  );
}
