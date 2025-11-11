"use client";

import { useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
//
import { DiscoverTab } from "./discover";
import { DataSyncTab } from "./DataSyncTab";
import { RightsTab } from "./RightsTab";
import { MLTab } from "./MLTab";
import { useAuth } from "@/lib/auth-context";
import { isAdmin } from "@/types/roles";
//
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
//

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!isAdmin(user.role)) {
      router.push("/");
      return;
    }
  }, [user, router]);

  useEffect(() => {
    const ctrl = abortControllerRef.current;
    return () => {
      if (ctrl) ctrl.abort();
    };
  }, []);

  if (!user || !isAdmin(user.role)) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center">
          <p className="text-muted-foreground">
            Vérification des permissions...
          </p>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-10">
          <p className="text-muted-foreground">Chargement…</p>
        </div>
      }
    >
      <div className="container mx-auto py-10 space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            Panel d&apos;Administration
          </h1>
          <p className="text-muted-foreground">
            Gestion du système de crawl de données League of Legends
          </p>
        </div>
        <AdminTabs />
      </div>
    </Suspense>
  );
}

function AdminTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab =
    (searchParams?.get("tab") as "discover" | "sync" | "rights" | "ml") ||
    "discover";

  return (
    <Tabs
      value={currentTab}
      onValueChange={(v) => router.replace(`/admin?tab=${v}`)}
      className="w-full"
    >
      <TabsList className="mb-6">
        <TabsTrigger value="discover">Découverte de joueurs</TabsTrigger>
        <TabsTrigger value="sync">Synchronisation de données</TabsTrigger>
        <TabsTrigger value="rights">Gestion des droits</TabsTrigger>
        <TabsTrigger value="ml">Machine Learning</TabsTrigger>
      </TabsList>

      <TabsContent value="discover" className="space-y-6">
        <DiscoverTab />
      </TabsContent>

      <TabsContent value="sync">
        <DataSyncTab />
      </TabsContent>

      <TabsContent value="rights">
        <RightsTab />
      </TabsContent>

      <TabsContent value="ml">
        <MLTab />
      </TabsContent>
    </Tabs>
  );
}
