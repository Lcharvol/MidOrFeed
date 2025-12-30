"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { isAdmin } from "@/types/roles";
import {
  LogOutIcon,
  SettingsIcon,
  UserIcon,
  UsersIcon,
  Loader2Icon,
  MoonIcon,
  SunIcon,
  SearchIcon,
  MenuIcon,
  LayersIcon,
  TrophyIcon,
  BarChartIcon,
  ShieldCheckIcon,
  PlusIcon,
  HeartIcon,
  SparklesIcon,
  SwordIcon,
  PackageIcon,
  ChevronDownIcon,
  RefreshCwIcon,
  CheckIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { useRiotProfileIcon } from "@/lib/hooks/use-riot-profile-icon";
import { useSummonerSearch } from "@/lib/hooks/use-summoner-search";
import { getInitials } from "@/lib/profile-utils";
import { useI18n } from "@/lib/i18n-context";
import { RIOT_REGIONS } from "@/lib/riot-regions";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/NotificationBell";
import { useGameVersionContext } from "@/components/GameVersionProvider";

type NavEntry = {
  key: string;
  href: string;
  icon: LucideIcon;
  title: string;
  description?: string;
  isActive: (path?: string | null) => boolean;
};

type NavGroup = {
  key: string;
  label: string;
  icon: LucideIcon;
  entries: NavEntry[];
  isActive: (path?: string | null) => boolean;
};

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isVersionOpen, setIsVersionOpen] = useState(false);
  const isMobile = useIsMobile();
  const {
    searchQuery,
    setSearchQuery,
    searchRegion,
    setSearchRegion,
    isSearching,
    searchResults,
    recentSearches,
    search: performFullSearch,
    navigateToResult,
    handleRecentClick,
    clearSearch,
  } = useSummonerSearch({
    onNavigate: () => setIsSearchOpen(false),
  });
  const { profileIconUrl, isLoading: isLoadingIcon } = useRiotProfileIcon(
    user?.leagueAccount?.puuid,
    user?.leagueAccount?.riotRegion
  );
  const { t } = useI18n();
  const {
    versions,
    currentVersion,
    selectedVersion,
    isLoading: versionsLoading,
    isValidating: versionsValidating,
    selectVersion,
    clearSelection,
    refresh: refreshVersions,
  } = useGameVersionContext();
  const versionLabel = selectedVersion ?? currentVersion ?? "Inconnue";
  const isCustomVersion =
    selectedVersion !== null && selectedVersion !== currentVersion;

  const navigationTriggerClasses =
    "group inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary data-[state=open]:bg-primary/10 data-[state=open]:text-primary";
  const navigationLinkClasses =
    "flex gap-3 select-none rounded-md p-3 leading-none text-sm text-muted-foreground no-underline outline-none transition-colors hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary";
  const standaloneNavLinkClasses =
    "flex items-center gap-2 select-none rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus:bg-primary/15 focus:text-primary";
  const mobileLinkClasses =
    "flex items-center gap-2 rounded-md px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary";
  const mobilePrimaryLinkClasses =
    "flex items-center gap-2 rounded-md px-4 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary";
  const activeTriggerClass = "bg-primary/10 text-primary shadow-sm";
  const activeLinkClass =
    "border border-primary/40 bg-primary/10 text-primary shadow";
  const desktopIconClass = "mt-0.5 size-5 text-primary shrink-0";
  const mobileIconClass = "size-4 text-primary";
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
    ];

    const meta: NavEntry[] = [
      {
        key: "meta-compare",
        href: "/compare",
        icon: UsersIcon,
        title: "Comparer",
        description: "Compare les stats de deux joueurs.",
        isActive: pathEquals("/compare"),
      },
      {
        key: "meta-counter-picks",
        href: "/counter-picks",
        icon: SwordIcon,
        title: "Counter Picks",
        description: "Trouve les meilleurs contres pour chaque champion.",
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
        title: "Leaderboard",
        description: "Consulte les joueurs les mieux classés par région.",
        isActive: pathEquals("/leaderboard"),
      },
    ];

    return [
      {
        key: "compositions",
        label: t("compositions.menu"),
        icon: LayersIcon,
        entries: compositions,
        isActive: pathStartsWith("/compositions"),
      },
      {
        key: "meta",
        label: "Meta & Stats",
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

  const renderDesktopEntry = (entry: NavEntry) => {
    const IconComponent = entry.icon;
    return (
      <li key={entry.key}>
        <NavigationMenuLink
          href={entry.href}
          icon={<IconComponent className={desktopIconClass} />}
          className={cn(
            navigationLinkClasses,
            entry.isActive(pathname) && activeLinkClass
          )}
        >
          <div className="flex-1 space-y-1">
            <div className="text-sm font-medium leading-none">
              {entry.title}
            </div>
            {entry.description ? (
              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                {entry.description}
              </p>
            ) : null}
          </div>
        </NavigationMenuLink>
      </li>
    );
  };

  const renderMobileEntry = (entry: NavEntry) => {
    const IconComponent = entry.icon;
    return (
      <Link
        key={entry.key}
        href={entry.href}
        className={cn(
          mobileLinkClasses,
          entry.isActive(pathname) && "bg-primary/10 text-primary"
        )}
        onClick={() => setMobileMenuOpen(false)}
      >
        <IconComponent className={mobileIconClass} />
        {entry.title}
      </Link>
    );
  };

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Recent searches logic is handled by useRecentSearch

  const handleLogout = () => {
    logout();
    toast.success(t("header.logoutSuccessful"));
    router.push("/");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };


  const handleSelectVersion = useCallback(
    async (version: string) => {
      if (version === selectedVersion) {
        setIsVersionOpen(false);
        return;
      }

      selectVersion(version);
      toast.success(`Version ${version} sélectionnée.`);
      setIsVersionOpen(false);
    },
    [selectedVersion, selectVersion]
  );

  // Menu de navigation pour desktop
  const NavigationContent = () => (
    <>
      {dropdownGroups.map((group) => {
        const GroupIcon = group.icon;
        return (
          <NavigationMenuItem key={group.key}>
            <NavigationMenuTrigger
              className={cn(
                navigationTriggerClasses,
                group.isActive(pathname) && activeTriggerClass
              )}
            >
              <GroupIcon className="mr-2 size-4" />
              {group.label}
            </NavigationMenuTrigger>
            <NavigationMenuContent className="rounded-xl shadow-lg">
              <ul className="grid w-[300px] gap-3 p-4">
                {group.entries.map(renderDesktopEntry)}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        );
      })}

      {user && (
        <>
          <NavigationMenuItem>
            <Link
              href={
                user?.leagueAccount
                  ? `/summoners/${user.leagueAccount.puuid}/overview?region=${user.leagueAccount.riotRegion}`
                  : "/summoners"
              }
              className={cn(
                standaloneNavLinkClasses,
                pathname?.startsWith("/summoners") && activeTriggerClass
              )}
            >
              <UserIcon className="size-4" />
              {t("header.monProfil")}
            </Link>
          </NavigationMenuItem>
          {isAdmin(user.role) && (
            <NavigationMenuItem>
              <Link
                href="/admin"
                className={cn(
                  standaloneNavLinkClasses,
                  pathname?.startsWith("/admin") && activeTriggerClass
                )}
              >
                <ShieldCheckIcon className="size-4" />
                Admin
              </Link>
            </NavigationMenuItem>
          )}
        </>
      )}
    </>
  );

  // Menu mobile avec accordéons
  const MobileMenuContent = () => (
    <nav className="flex flex-col space-y-2 px-2">
      <Accordion type="single" collapsible className="w-full">
        {dropdownGroups.map((group) => {
          const GroupIcon = group.icon;
          return (
            <AccordionItem value={group.key} key={group.key}>
              <AccordionTrigger className="text-base font-medium px-4 py-3 text-muted-foreground transition-colors hover:text-primary data-[state=open]:text-primary">
                <div className="flex items-center gap-2">
                  <GroupIcon className="size-4" />
                  {group.label}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col space-y-1 pl-6 pr-2 pb-2">
                  {group.entries.map(renderMobileEntry)}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {user && (
        <>
          <Separator className="my-3" />
          <Link
            href={
              user?.leagueAccount
                ? `/summoners/${user.leagueAccount.puuid}/overview?region=${user.leagueAccount.riotRegion}`
                : "/summoners"
            }
            className={cn(
              mobilePrimaryLinkClasses,
              pathname?.startsWith("/summoners") && "bg-primary/10 text-primary"
            )}
            onClick={() => setMobileMenuOpen(false)}
          >
            <UserIcon className="size-4" />
            {t("header.monProfil")}
          </Link>
          {isAdmin(user.role) && (
            <Link
              href="/admin"
              className={cn(
                mobilePrimaryLinkClasses,
                pathname?.startsWith("/admin") && "bg-primary/10 text-primary"
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              <ShieldCheckIcon className="size-4" />
              Admin
            </Link>
          )}
        </>
      )}
    </nav>
  );

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/75">
      <div className="flex h-16 items-center justify-between px-2 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-6">
          <Link href="/" className="flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="MidOrFeed"
              width={45}
              height={80}
              priority
            />
          </Link>

          {/* Menu desktop */}
          {!isMobile && (
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationContent />
              </NavigationMenuList>
            </NavigationMenu>
          )}

          {/* Menu mobile */}
          {isMobile && (
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-muted/60"
                >
                  <MenuIcon className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[280px] sm:w-[320px] bg-background/95"
              >
                <SheetHeader className="pb-4">
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <MobileMenuContent />
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <Popover open={isVersionOpen} onOpenChange={setIsVersionOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border border-border/70 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors",
                  "hover:border-primary/60 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  (versionsLoading || versionsValidating) && "cursor-progress"
                )}
              >
                {versionsLoading || versionsValidating ? (
                  <>
                    <Loader2Icon className="size-3.5 animate-spin" />
                    <span>Patch</span>
                  </>
                ) : (
                  <>
                    <span className="uppercase text-[11px] tracking-wide text-muted-foreground">
                      Patch
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      {versionLabel}
                    </span>
                    <ChevronDownIcon className="size-3 text-muted-foreground" />
                  </>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[220px] rounded-xl border border-border/60 bg-background/95 p-3 shadow-lg backdrop-blur"
              align="end"
              sideOffset={12}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[11px] font-semibold uppercase text-muted-foreground">
                  Versions du jeu
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-primary"
                  onClick={() => {
                    void refreshVersions();
                  }}
                >
                  <RefreshCwIcon className="size-3.5" />
                  <span className="sr-only">Rafraîchir les versions</span>
                </Button>
              </div>

              <div className="max-h-60 space-y-1 overflow-y-auto">
                {versionsLoading && (
                  <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
                    <Loader2Icon className="size-3.5 animate-spin" />
                    Chargement...
                  </div>
                )}
                {!versionsLoading && versions.length === 0 && (
                  <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                    Aucune version trouvée. Lancez une synchronisation depuis
                    l’espace admin.
                  </div>
                )}
                {!versionsLoading &&
                  versions.map((entry) => {
                    const isActive = entry.version === selectedVersion;
                    const isGlobal = entry.version === currentVersion;
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => handleSelectVersion(entry.version)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs transition-colors",
                          isActive
                            ? "bg-primary/15 text-primary"
                            : "hover:bg-muted/70"
                        )}
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">
                            {entry.version}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(entry.createdAt).toLocaleDateString(
                              "fr-FR"
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isGlobal && (
                            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                              Officiel
                            </span>
                          )}
                          {isActive ? (
                            <CheckIcon className="size-3.5 text-primary" />
                          ) : (
                            <span className="text-[10px] uppercase text-muted-foreground">
                              Utiliser
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
              </div>

              <div className="mt-3 rounded-md bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
                Patch officiel : {currentVersion ?? "inconnu"}. Sélectionnez un
                autre patch pour prévisualiser les données avec cette version
                (stocké sur cet appareil).
              </div>

              {isCustomVersion && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 w-full text-xs"
                  onClick={() => {
                    clearSelection();
                    toast.success("Patch officiel rétabli.");
                    setIsVersionOpen(false);
                  }}
                >
                  Revenir au patch officiel ({currentVersion ?? "inconnu"})
                </Button>
              )}
            </PopoverContent>
          </Popover>
          <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 hover:bg-muted/60"
              >
                <SearchIcon className="size-5" />
                <span className="sr-only">Rechercher</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[360px] p-0"
              align="end"
              sideOffset={12}
            >
              <Command shouldFilter={false}>
                <div className="flex items-center gap-3 px-4 py-3 bg-background/80 backdrop-blur rounded-t-xl shadow-sm ring-1 ring-border/30">
                  <div className="flex size-8 items-center justify-center rounded-full bg-primary/12 text-primary">
                    <SearchIcon className="size-4" />
                  </div>
                  <CommandInput
                    placeholder="Rechercher un invocateur..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        performFullSearch();
                      }
                    }}
                  />
                </div>
                <div className="flex items-center justify-between gap-2 px-4 py-3 bg-background/70 backdrop-blur">
                  <span className="text-xs text-muted-foreground">Région</span>
                  <Select value={searchRegion} onValueChange={setSearchRegion}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Région" />
                    </SelectTrigger>
                    <SelectContent>
                      {RIOT_REGIONS.map((regionOption) => (
                        <SelectItem
                          key={regionOption.value}
                          value={regionOption.value}
                        >
                          {regionOption.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <CommandList>
                  <CommandEmpty>
                    {searchQuery.length >= 2
                      ? "Aucun invocateur trouvé."
                      : "Tapez au moins deux caractères pour rechercher."}
                  </CommandEmpty>
                  {searchResults.length > 0 && (
                    <CommandGroup heading="Résultats">
                      {searchResults.map((result) => (
                        <CommandItem
                          key={result.puuid}
                          value={result.puuid}
                          onSelect={() => navigateToResult(result)}
                          className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-background/80 hover:border-primary/40 hover:bg-background transition-colors"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {result.gameName ?? "Inconnu"}
                              {result.tagLine && (
                                <span className="text-muted-foreground">
                                  #{result.tagLine}
                                </span>
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {result.region.toUpperCase()}
                              {typeof result.stats?.totalMatches === "number" &&
                                ` • ${result.stats.totalMatches} matchs`}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  {recentSearches.length > 0 && (
                    <CommandGroup heading="Recherches récentes">
                      {recentSearches.map((recent) => (
                        <CommandItem
                          key={`${recent.gameName}#${recent.tagLine}@${recent.region}`}
                          value={`${recent.gameName}#${recent.tagLine}`}
                          onSelect={() => handleRecentClick(recent)}
                          className="flex items-center justify-between gap-3"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {recent.gameName}
                              <span className="text-muted-foreground">
                                #{recent.tagLine}
                              </span>
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {recent.region.toUpperCase()}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
                <div className="border-t px-3 py-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full"
                    onClick={() => performFullSearch()}
                    disabled={isSearching || searchQuery.length < 2}
                  >
                    {isSearching ? (
                      <>
                        <Loader2Icon className="mr-2 size-4 animate-spin" />
                        Recherche...
                      </>
                    ) : (
                      <>
                        <SearchIcon className="mr-2 size-4" />
                        Rechercher
                      </>
                    )}
                  </Button>
                </div>
              </Command>
            </PopoverContent>
          </Popover>
          <NotificationBell />
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

          {user ? (
            <>
              <Separator
                orientation="vertical"
                className="hidden sm:block h-6"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="focus:outline-none">
                    <Avatar className="h-9 w-9 cursor-pointer">
                      {isLoadingIcon ? (
                        <AvatarFallback className="bg-muted">
                          <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
                        </AvatarFallback>
                      ) : profileIconUrl ? (
                        <>
                          <AvatarImage
                            src={profileIconUrl}
                            alt="Profile Icon"
                          />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {getInitials(user.name, user.email)}
                          </AvatarFallback>
                        </>
                      ) : (
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(user.name, user.email)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.name || t("header.user")}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <UserIcon className="mr-2 size-4" />
                      {t("header.profile")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <SettingsIcon className="mr-2 size-4" />
                      {t("header.settings")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOutIcon className="mr-2 size-4" />
                    {t("header.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hidden sm:inline-flex"
              >
                <Link href="/login">{t("header.login")}</Link>
              </Button>
              <Separator
                orientation="vertical"
                className="hidden sm:block h-6"
              />
              <Button size="sm" asChild>
                <Link href="/signup">{t("header.signup")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
