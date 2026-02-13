"use client";

import { Button } from "@/components/ui/button";
import { DataState } from "@/components/ui/data-state";
import { RefreshCwIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";

interface ErrorStateProps {
  onRetry?: () => void;
}

export const ErrorState = ({ onRetry }: ErrorStateProps) => {
  const { t } = useI18n();

  return (
    <DataState
      tone="danger"
      variant="plain"
      title={t("errors.loadingTitle")}
      description={t("errors.loadingDescription")}
      containerClassName="py-20"
      action={
        onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCwIcon className="mr-2 h-4 w-4" />
            {t("errors.retry")}
          </Button>
        ) : undefined
      }
    />
  );
};
