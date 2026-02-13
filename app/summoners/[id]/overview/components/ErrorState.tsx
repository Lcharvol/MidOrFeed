"use client";

import { Button } from "@/components/ui/button";
import { DataState } from "@/components/ui/data-state";
import { RefreshCwIcon } from "lucide-react";

interface ErrorStateProps {
  onRetry?: () => void;
}

export const ErrorState = ({ onRetry }: ErrorStateProps) => (
  <DataState
    tone="danger"
    variant="plain"
    title="Erreur de chargement"
    description="Erreur lors du chargement des données"
    containerClassName="py-20"
    action={
      onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCwIcon className="mr-2 h-4 w-4" />
          Réessayer
        </Button>
      ) : undefined
    }
  />
);
