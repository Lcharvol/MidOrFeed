"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="mb-6 text-3xl font-bold">Paramètres</h1>

        <Card>
          <CardHeader>
            <CardTitle>Application</CardTitle>
            <CardDescription>
              Gérez les paramètres de l&apos;application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Thème</h3>
              <p className="text-sm text-muted-foreground">
                Le mode sombre est actuellement activé (League of Legends style)
              </p>
            </div>
            <Separator />
            <div>
              <h3 className="text-sm font-medium mb-2">Langue</h3>
              <p className="text-sm text-muted-foreground">Français (FR)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Compte</CardTitle>
            <CardDescription>
              Gérez les paramètres de votre compte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Notifications</h3>
              <p className="text-sm text-muted-foreground">
                Les notifications sont désactivées pour le moment
              </p>
            </div>
            <Separator />
            <div>
              <h3 className="text-sm font-medium mb-2">Confidentialité</h3>
              <p className="text-sm text-muted-foreground">
                Votre profil est privé
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
