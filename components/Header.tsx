"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  MoonIcon,
  SunIcon,
  LayersIcon,
  TrophyIcon,
  PlusIcon,
  HeartIcon,
  SparklesIcon,
  SwordIcon,
  PackageIcon,
  UsersIcon,
  BarChartIcon,
  DownloadIcon,
  GamepadIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { NotificationBell } from "@/components/NotificationBell";
import { HeaderNavigation } from "@/components/header/HeaderNavigation";
import { HeaderMobileMenu } from "@/components/header/HeaderMobileMenu";
import { HeaderVersionSelector } from "@/components/header/HeaderVersionSelector";
import { HeaderSearch } from "@/components/header/HeaderSearch";
import { HeaderUserMenu } from "@/components/header/HeaderUserMenu";
import type { NavEntry, NavGroup } from "@/components/header/header-types";

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isVersionOpen, setIsVersionOpen] = useState(false);
  const isMobile = useIsMobile();
  const { t } = useI18n();

  const pathEquals =
    (target: string) =>
    (path?: string | null): boolean =>
      path === target;
  const pathStartsWith =
    (prefix: string) =>
    (path?: string | null): boolean =>
      Boolean(path?.startsWith(prefix));

  const dropdownGroups = useMemo<NavGroup[]>(() => {
    const compositions: NavEntry[] = [
      {
        key: "compositions-create",
        href: "/compositions/create",
        icon: PlusIcon,
        title: t("compositions.create.title"),
        description: t("compositions.create.description"),
        isActive: pathEquals("/compositions/create"),
      },
      {
        key: "compositions-popular",
        href: "/compositions/popular",
        icon: SparklesIcon,
        title: t("compositions.popular.title"),
        description: t("compositions.popular.description"),
        isActive: pathEquals("/compositions/popular"),
      },
      {
        key: "compositions-favorites",
        href: "/compositions/favorites",
        icon: HeartIcon,
        title: t("compositions.favorites.title"),
        description: t("compositions.favorites.description"),
        isActive: pathEquals("/compositions/favorites"),
      },
      {
        key: "compositions-draft",
        href: "/draft",
        icon: GamepadIcon,
        title: t("draft.navTitle"),
        description: t("draft.navDescription"),
        isActive: pathEquals("/draft"),
      },
    ];

    const meta: NavEntry[] = [
      {
        key: "meta-compare",
        href: "/compare",
        icon: UsersIcon,
        title: t("header.nav.compare"),
        description: t("header.nav.compareDescription"),
        isActive: pathEquals("/compare"),
      },
      {
        key: "meta-counter-picks",
        href: "/counter-picks",
        icon: SwordIcon,
        title: t("header.nav.counterPicks"),
        description: t("header.nav.counterPicksDescription"),
        isActive: pathEquals("/counter-picks"),
      },
      {
        key: "meta-tier-list-champions",
        href: "/tier-list/champions",
        icon: SwordIcon,
        title: t("tierListMenu.champions.title"),
        description: t("tierListMenu.champions.description"),
        isActive: pathEquals("/tier-list/champions"),
      },
      {
        key: "meta-tier-list-items",
        href: "/tier-list/items",
        icon: PackageIcon,
        title: t("tierListMenu.items.title"),
        description: t("tierListMenu.items.description"),
        isActive: pathEquals("/tier-list/items"),
      },
      {
        key: "meta-leaderboard",
        href: "/leaderboard",
        icon: BarChartIcon,
        title: t("header.nav.leaderboard"),
        description: t("header.nav.leaderboardDescription"),
        isActive: pathEquals("/leaderboard"),
      },
    ];

    return [
      {
        key: "compositions",
        label: t("compositions.menu"),
        icon: LayersIcon,
        entries: compositions,
        isActive: (path) =>
          Boolean(
            path &&
              (path.startsWith("/compositions") || path === "/draft")
          ),
      },
      {
        key: "meta",
        label: t("header.nav.metaStats"),
        icon: TrophyIcon,
        entries: meta,
        isActive: (path) =>
          Boolean(
            path &&
              (path.startsWith("/tier-list") ||
                path === "/counter-picks" ||
                path === "/leaderboard" ||
                path === "/compare")
          ),
      },
    ];
  }, [t]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/90 backdrop-blur-md supports-backdrop-filter:bg-background/75">
      <div className="flex h-14 items-center justify-between px-3 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-6">
          <Link href="/" className="flex items-center justify-center" aria-label="Mid or Feed - Home">
            <Image
              src="/logo.webp"
              alt="MidOrFeed"
              width={45}
              height={80}
              priority
            />
          </Link>

          {!isMobile && (
            <NavigationMenu>
              <NavigationMenuList>
                <HeaderNavigation dropdownGroups={dropdownGroups} />
              </NavigationMenuList>
            </NavigationMenu>
          )}

          {isMobile && (
            <HeaderMobileMenu
              dropdownGroups={dropdownGroups}
              mobileMenuOpen={mobileMenuOpen}
              setMobileMenuOpen={setMobileMenuOpen}
            />
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <HeaderVersionSelector
            isVersionOpen={isVersionOpen}
            setIsVersionOpen={setIsVersionOpen}
          />
          <HeaderSearch
            isSearchOpen={isSearchOpen}
            setIsSearchOpen={setIsSearchOpen}
          />
          <NotificationBell />
          <Button
            variant="outline"
            size="sm"
            asChild
            className="hidden sm:inline-flex gap-1.5 h-9"
          >
            <Link href="/download">
              <DownloadIcon className="size-4" />
              Overlay
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="sm:hidden h-9 w-9 hover:bg-muted/60"
          >
            <Link href="/download">
              <DownloadIcon className="size-5" />
              <span className="sr-only">Download Overlay</span>
            </Link>
          </Button>
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 hover:bg-muted/60"
            >
              {theme === "dark" ? (
                <SunIcon className="size-5" />
              ) : (
                <MoonIcon className="size-5" />
              )}
              <span className="sr-only">{t("header.toggleTheme")}</span>
            </Button>
          )}

          <HeaderUserMenu />
        </div>
      </div>
    </header>
  );
}
