"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { SwordIcon } from "lucide-react";

const ItemSelector = dynamic(
  () => import("@/components/build-tools").then((mod) => mod.ItemSelector),
  { ssr: false, loading: () => <Skeleton className="h-32 w-full" /> }
);

export const GuideBuildSection = ({
  starterItems,
  setStarterItems,
  coreItems,
  setCoreItems,
  situationalItems,
  setSituationalItems,
  bootsItems,
  setBootsItems,
}: {
  starterItems: string[];
  setStarterItems: (v: string[]) => void;
  coreItems: string[];
  setCoreItems: (v: string[]) => void;
  situationalItems: string[];
  setSituationalItems: (v: string[]) => void;
  bootsItems: string[];
  setBootsItems: (v: string[]) => void;
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <SwordIcon className="size-5" />
        Build Items
      </CardTitle>
      <CardDescription>
        Définissez l'ordre des items à acheter
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <ItemSelector
        label="Items de départ"
        selectedItems={starterItems}
        onItemsChange={setStarterItems}
        maxItems={3}
        placeholder="Ajouter un item de départ"
        starterOnly
        dialogTitle="Sélectionner un item de départ"
      />

      <Separator />

      <ItemSelector
        label="Items core"
        selectedItems={coreItems}
        onItemsChange={setCoreItems}
        maxItems={4}
        placeholder="Ajouter un item core"
        completedOnly
        dialogTitle="Sélectionner un item core"
      />

      <Separator />

      <ItemSelector
        label="Items situationnels"
        selectedItems={situationalItems}
        onItemsChange={setSituationalItems}
        maxItems={6}
        placeholder="Ajouter un item situationnel"
        completedOnly
        dialogTitle="Sélectionner un item situationnel"
      />

      <Separator />

      <ItemSelector
        label="Bottes"
        selectedItems={bootsItems}
        onItemsChange={setBootsItems}
        maxItems={2}
        placeholder="Ajouter des bottes"
        filterTag="Boots"
        dialogTitle="Sélectionner des bottes"
      />
    </CardContent>
  </Card>
);
