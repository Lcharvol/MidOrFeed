"use client";

import { DataState } from "@/components/ui/data-state";

export const LoadingState = () => (
  <DataState
    isLoading
    variant="plain"
    title="Chargement des données..."
    containerClassName="py-20"
  />
);
