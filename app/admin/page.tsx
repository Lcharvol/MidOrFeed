"use client";

import { useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/auth-context";
import { isAdmin } from "@/types/roles";
import { useI18n } from "@/lib/i18n-context";
import { LazyLoadingFallback } from "@/lib/lazy-components";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Lazy load les onglets admin (composants lourds)
const DiscoverTab = dynamic(
  () => import("./discover").then((mod) => ({ default: mod.DiscoverTab })),
  { loading: () => <LazyLoadingFallback />, ssr: false }
);

const DataSyncTab = dynamic(
  () => import("./DataSyncTab").then((mod) => ({ default: mod.DataSyncTab })),
  { loading: () => <LazyLoadingFallback />, ssr: false }
);

const RightsTab = dynamic(
  () => import("./RightsTab").then((mod) => ({ default: mod.RightsTab })),
  { loading: () => <LazyLoadingFallback />, ssr: false }
);

const MLTab = dynamic(
  () => import("./MLTab").then((mod) => ({ default: mod.MLTab })),
  { loading: () => <LazyLoadingFallback />, ssr: false }
);

const ApiTestTab = dynamic(
  () => import("./ApiTestTab").then((mod) => ({ default: mod.ApiTestTab })),
  { loading: () => <LazyLoadingFallback />, ssr: false }
);

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      router.push("/login");
      return;
    }
    if (!isAdmin(user.role)) {
      router.push("/");
      return;
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const ctrl = abortControllerRef.current;
    return () => {
      if (ctrl) ctrl.abort();
    };
  }, []);

  if (isLoading || !user || !isAdmin(user.role)) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center">
          <p className="text-muted-foreground">
            {t("admin.verifyingPermissions")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-10">
          <p className="text-muted-foreground">{t("admin.loading")}</p>
        </div>
      }
    >
      <div className="container mx-auto py-10 space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">{t("admin.title")}</h1>
          <p className="text-muted-foreground">{t("admin.description")}</p>
        </div>
        <AdminTabs />
      </div>
    </Suspense>
  );
}

function AdminTabs() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab =
    (searchParams?.get("tab") as "discover" | "sync" | "rights" | "ml" | "api") ||
    "discover";

  return (
    <Tabs
      value={currentTab}
      onValueChange={(v) => router.replace(`/admin?tab=${v}`)}
      className="w-full"
    >
      <TabsList className="mb-6">
        <TabsTrigger value="discover">{t("admin.tabs.discover")}</TabsTrigger>
        <TabsTrigger value="sync">{t("admin.tabs.sync")}</TabsTrigger>
        <TabsTrigger value="rights">{t("admin.tabs.rights")}</TabsTrigger>
        <TabsTrigger value="ml">{t("admin.tabs.ml")}</TabsTrigger>
        <TabsTrigger value="api">{t("admin.tabs.api")}</TabsTrigger>
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

      <TabsContent value="api">
        <ApiTestTab />
      </TabsContent>
    </Tabs>
  );
}
