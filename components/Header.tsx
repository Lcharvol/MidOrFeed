"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import { getProfileIconUrl } from "@/constants/ddragon";
import { useAuth } from "@/lib/auth-context";
import { isAdmin } from "@/types/roles";
import {
  LogOutIcon,
  SettingsIcon,
  UserIcon,
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
} from "lucide-react";
import { toast } from "sonner";
import { useRiotProfileIcon } from "@/lib/hooks/use-riot-profile-icon";
import { useRecentSearch } from "@/lib/hooks/use-recent-search";
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
import { NotificationProvider } from "@/components/NotificationProvider";
import { NotificationBell } from "@/components/NotificationBell";

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchRegion, setSearchRegion] = useState("euw1");
  const [isSearching, setIsSearching] = useState(false);
  const { recentSearches, addRecentSearch } = useRecentSearch();
  type LocalSearchResult = {
    puuid: string;
    gameName?: string;
    tagLine?: string;
    region: string;
    profileIconId?: number;
    stats?: { totalMatches?: number };
  };
  const [searchResults, setSearchResults] = useState<LocalSearchResult[]>([]);
  const { profileIconUrl, isLoading: isLoadingIcon } = useRiotProfileIcon(
    user?.leagueAccount?.puuid,
    user?.leagueAccount?.riotRegion
  );
  const { t } = useI18n();

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

  // Recherche locale en temps réel
  const performLocalSearch = useCallback(
    async (query: string) => {
      if (!query || query.length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        const response = await fetch("/api/search/summoners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query,
            region: searchRegion,
            limit: 5,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          setSearchResults(result.results || []);
        }
      } catch (error) {
        console.error("Local search error:", error);
      }
    },
    [searchRegion]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      performLocalSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, performLocalSearch]);

  const handleSummonerSearch = async (query: string) => {
    if (!query || query.length < 2) return;

    setIsSearching(true);
    try {
      // Parse query like "GameName#TagLine" or "GameName #TagLine"
      const match = query.match(/^([^#]+)#?(\S*)$/);
      if (!match) {
        toast.error(t("header.searchInvalidFormat"));
        return;
      }

      const [, gameName, tagLine] = match;

      if (!gameName || !tagLine) {
        toast.error(t("header.searchInvalidFormat"));
        return;
      }

      // Try to search for the summoner using selected region
      const region = searchRegion;

      const response = await fetch("/api/riot/search-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameName: gameName.trim(),
          tagLine: tagLine.trim(),
          region,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || t("header.searchError"));
        return;
      }

      // Enregistrer la recherche comme récente
      addRecentSearch(gameName, tagLine, region);

      // Redirect to summoner page with the found PUUID
      router.push(`/summoners?puuid=${result.puuid}&region=${region}`);
    } catch (error) {
      console.error("Search error:", error);
      toast.error(t("header.searchError"));
    } finally {
      setIsSearching(false);
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  // Menu de navigation pour desktop
  const NavigationContent = () => (
    <>
      <NavigationMenuItem>
        <NavigationMenuTrigger
          className={cn(
            navigationTriggerClasses,
            pathname?.startsWith("/compositions") &&
              "bg-primary/10 text-primary shadow-sm"
          )}
        >
          <LayersIcon className="mr-2 size-4" />
          {t("compositions.menu")}
        </NavigationMenuTrigger>
        <NavigationMenuContent className="rounded-xl shadow-lg">
          <ul className="grid w-[300px] gap-3 p-4">
            <li>
              <NavigationMenuLink asChild>
                <Link
                  href="/compositions/create"
                  className={cn(
                    navigationLinkClasses,
                    pathname === "/compositions/create" &&
                      "border border-primary/40 bg-primary/10 text-primary shadow"
                  )}
                >
                  <PlusIcon className="mt-0.5 size-5 text-primary shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="text-sm font-medium leading-none">
                      {t("compositions.create.title")}
                    </div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      {t("compositions.create.description")}
                    </p>
                  </div>
                </Link>
              </NavigationMenuLink>
            </li>
            <li>
              <NavigationMenuLink asChild>
                <Link
                  href="/compositions/popular"
                  className={cn(
                    navigationLinkClasses,
                    pathname === "/compositions/popular" &&
                      "border border-primary/40 bg-primary/10 text-primary shadow"
                  )}
                >
                  <SparklesIcon className="mt-0.5 size-5 text-primary shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="text-sm font-medium leading-none">
                      {t("compositions.popular.title")}
                    </div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      {t("compositions.popular.description")}
                    </p>
                  </div>
                </Link>
              </NavigationMenuLink>
            </li>
            <li>
              <NavigationMenuLink asChild>
                <Link
                  href="/compositions/favorites"
                  className={cn(
                    navigationLinkClasses,
                    pathname === "/compositions/favorites" &&
                      "border border-primary/40 bg-primary/10 text-primary shadow"
                  )}
                >
                  <HeartIcon className="mt-0.5 size-5 text-primary shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="text-sm font-medium leading-none">
                      {t("compositions.favorites.title")}
                    </div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      {t("compositions.favorites.description")}
                    </p>
                  </div>
                </Link>
              </NavigationMenuLink>
            </li>
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>

      <NavigationMenuItem>
        <NavigationMenuTrigger
          className={cn(
            navigationTriggerClasses,
            pathname?.startsWith("/tier-list") &&
              "bg-primary/10 text-primary shadow-sm"
          )}
        >
          <TrophyIcon className="mr-2 size-4" />
          {t("tierListMenu.title")}
        </NavigationMenuTrigger>
        <NavigationMenuContent className="rounded-xl shadow-lg">
          <ul className="grid w-[300px] gap-3 p-4">
            <li>
              <NavigationMenuLink asChild>
                <Link
                  href="/tier-list/champions"
                  className={cn(
                    navigationLinkClasses,
                    pathname === "/tier-list/champions" &&
                      "border border-primary/40 bg-primary/10 text-primary shadow"
                  )}
                >
                  <SwordIcon className="mt-0.5 size-5 text-primary shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="text-sm font-medium leading-none">
                      {t("tierListMenu.champions.title")}
                    </div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      {t("tierListMenu.champions.description")}
                    </p>
                  </div>
                </Link>
              </NavigationMenuLink>
            </li>
            <li>
              <NavigationMenuLink asChild>
                <Link
                  href="/tier-list/items"
                  className={cn(
                    navigationLinkClasses,
                    pathname === "/tier-list/items" &&
                      "border border-primary/40 bg-primary/10 text-primary shadow"
                  )}
                >
                  <PackageIcon className="mt-0.5 size-5 text-primary shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="text-sm font-medium leading-none">
                      {t("tierListMenu.items.title")}
                    </div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      {t("tierListMenu.items.description")}
                    </p>
                  </div>
                </Link>
              </NavigationMenuLink>
            </li>
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>

      <NavigationMenuItem>
        <Link
          href="/leaderboard"
          className={cn(
            standaloneNavLinkClasses,
            pathname === "/leaderboard" &&
              "bg-primary/10 text-primary shadow-sm"
          )}
        >
          <BarChartIcon className="size-4" />
          Leaderboard
        </Link>
      </NavigationMenuItem>

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
                pathname?.startsWith("/summoners") &&
                  "bg-primary/10 text-primary shadow-sm"
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
                  pathname?.startsWith("/admin") &&
                    "bg-primary/10 text-primary shadow-sm"
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
        <AccordionItem value="compositions">
          <AccordionTrigger className="text-base font-medium px-4 py-3 text-muted-foreground transition-colors hover:text-primary data-[state=open]:text-primary">
            <div className="flex items-center gap-2">
              <LayersIcon className="size-4" />
              {t("compositions.menu")}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col space-y-1 pl-6 pr-2 pb-2">
              <Link
                href="/compositions/create"
                className={mobileLinkClasses}
                onClick={() => setMobileMenuOpen(false)}
              >
                <PlusIcon className="size-4 text-primary" />
                {t("compositions.create.title")}
              </Link>
              <Link
                href="/compositions/popular"
                className={mobileLinkClasses}
                onClick={() => setMobileMenuOpen(false)}
              >
                <SparklesIcon className="size-4 text-primary" />
                {t("compositions.popular.title")}
              </Link>
              <Link
                href="/compositions/favorites"
                className={mobileLinkClasses}
                onClick={() => setMobileMenuOpen(false)}
              >
                <HeartIcon className="size-4 text-primary" />
                {t("compositions.favorites.title")}
              </Link>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="tier-list">
          <AccordionTrigger className="text-base font-medium px-4 py-3 text-muted-foreground transition-colors hover:text-primary data-[state=open]:text-primary">
            <div className="flex items-center gap-2">
              <TrophyIcon className="size-4" />
              {t("tierListMenu.title")}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col space-y-1 pl-6 pr-2 pb-2">
              <Link
                href="/tier-list/champions"
                className={mobileLinkClasses}
                onClick={() => setMobileMenuOpen(false)}
              >
                <SwordIcon className="size-4 text-primary" />
                {t("tierListMenu.champions.title")}
              </Link>
              <Link
                href="/tier-list/items"
                className={mobileLinkClasses}
                onClick={() => setMobileMenuOpen(false)}
              >
                <PackageIcon className="size-4 text-primary" />
                {t("tierListMenu.items.title")}
              </Link>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Link
        href="/leaderboard"
        className={cn(
          mobilePrimaryLinkClasses,
          pathname === "/leaderboard" && "bg-primary/10 text-primary"
        )}
        onClick={() => setMobileMenuOpen(false)}
      >
        <BarChartIcon className="size-4" />
        Leaderboard
      </Link>

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
              width={50}
              height={140}
              className="h-auto w-10 sm:w-12"
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
