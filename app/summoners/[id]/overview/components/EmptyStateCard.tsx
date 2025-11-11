"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Gamepad2Icon } from "lucide-react";

export const EmptyStateCard = () => (
  <Card>
    <CardHeader>
      <CardTitle>Aucune donnée</CardTitle>
      <CardDescription>
        Les statistiques apparaîtront après avoir collecté des matchs
      </CardDescription>
    </CardHeader>
    <CardContent className="flex flex-col items-center justify-center gap-4 py-10">
      <Gamepad2Icon className="size-16 text-muted-foreground" />
    </CardContent>
  </Card>
);
