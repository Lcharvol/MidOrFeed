"use client";

import { DataState } from "@/components/ui/data-state";

export const ErrorState = () => (
  <DataState
    tone="danger"
    variant="plain"
    title="Erreur de chargement"
    description="Erreur lors du chargement des données"
    containerClassName="py-20"
  />
);
