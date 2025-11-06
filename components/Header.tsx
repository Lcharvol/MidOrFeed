"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  CrownIcon,
  MenuIcon,
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

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
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
        <NavigationMenuTrigger>{t("compositions.menu")}</NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul className="grid w-[300px] gap-3 p-4">
            <li>
              <NavigationMenuLink asChild>
                <Link
                  href="/compositions/create"
                  className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  <div className="text-sm font-medium leading-none">
                    {t("compositions.create.title")}
                  </div>
                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                    {t("compositions.create.description")}
                  </p>
                </Link>
              </NavigationMenuLink>
            </li>
            <li>
              <NavigationMenuLink asChild>
                <Link
                  href="/compositions/popular"
                  className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  <div className="text-sm font-medium leading-none">
                    {t("compositions.popular.title")}
                  </div>
                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                    {t("compositions.popular.description")}
                  </p>
                </Link>
              </NavigationMenuLink>
            </li>
            <li>
              <NavigationMenuLink asChild>
                <Link
                  href="/compositions/favorites"
                  className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  <div className="text-sm font-medium leading-none">
                    {t("compositions.favorites.title")}
                  </div>
                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                    {t("compositions.favorites.description")}
                  </p>
                </Link>
              </NavigationMenuLink>
            </li>
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>

      <NavigationMenuItem>
        <NavigationMenuTrigger>{t("tierListMenu.title")}</NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul className="grid w-[300px] gap-3 p-4">
            <li>
              <NavigationMenuLink asChild>
                <Link
                  href="/tier-list/champions"
                  className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  <div className="text-sm font-medium leading-none">
                    {t("tierListMenu.champions.title")}
                  </div>
                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                    {t("tierListMenu.champions.description")}
                  </p>
                </Link>
              </NavigationMenuLink>
            </li>
            <li>
              <NavigationMenuLink asChild>
                <Link
                  href="/tier-list/items"
                  className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  <div className="text-sm font-medium leading-none">
                    {t("tierListMenu.items.title")}
                  </div>
                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                    {t("tierListMenu.items.description")}
                  </p>
                </Link>
              </NavigationMenuLink>
            </li>
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>

      <NavigationMenuItem>
        <Link
          href="/leaderboard"
          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
        >
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
              className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
            >
              {t("header.monProfil")}
            </Link>
          </NavigationMenuItem>
          {isAdmin(user.role) && (
            <NavigationMenuItem>
              <Link
                href="/admin"
                className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
              >
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
          <AccordionTrigger className="text-base font-medium px-4 py-3">
            {t("compositions.menu")}
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col space-y-1 pl-6 pr-2 pb-2">
              <Link
                href="/compositions/create"
                className="block rounded-md px-4 py-2.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("compositions.create.title")}
              </Link>
              <Link
                href="/compositions/popular"
                className="block rounded-md px-4 py-2.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("compositions.popular.title")}
              </Link>
              <Link
                href="/compositions/favorites"
                className="block rounded-md px-4 py-2.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("compositions.favorites.title")}
              </Link>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="tier-list">
          <AccordionTrigger className="text-base font-medium px-4 py-3">
            {t("tierListMenu.title")}
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col space-y-1 pl-6 pr-2 pb-2">
              <Link
                href="/tier-list/champions"
                className="block rounded-md px-4 py-2.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("tierListMenu.champions.title")}
              </Link>
              <Link
                href="/tier-list/items"
                className="block rounded-md px-4 py-2.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("tierListMenu.items.title")}
              </Link>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Link
        href="/leaderboard"
        className="block rounded-md px-4 py-3 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        onClick={() => setMobileMenuOpen(false)}
      >
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
            className="block rounded-md px-4 py-3 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={() => setMobileMenuOpen(false)}
          >
            {t("header.monProfil")}
          </Link>
          {isAdmin(user.role) && (
            <Link
              href="/admin"
              className="block rounded-md px-4 py-3 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Admin
            </Link>
          )}
        </>
      )}
    </nav>
  );

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
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
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <MenuIcon className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[320px]">
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
          {/* Premium temporarily hidden to comply with Riot policy */}

          {/* Search Bar */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <SearchIcon className="h-5 w-5" />
                <span className="sr-only">{t("header.searchSummoner")}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[calc(100vw-2rem)] sm:w-[400px] p-3"
              align="end"
            >
              <div className="space-y-3">
                {/* Region Selector */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium whitespace-nowrap">
                    {t("profile.region")}:
                  </label>
                  <Select value={searchRegion} onValueChange={setSearchRegion}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RIOT_REGIONS.map((region) => (
                        <SelectItem key={region.value} value={region.value}>
                          {region.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Search Input */}
                <Command className="border rounded-md">
                  <CommandInput
                    placeholder={t("header.searchPlaceholder")}
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && searchQuery) {
                        handleSummonerSearch(searchQuery);
                      }
                    }}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {searchQuery.length < 2
                        ? t("header.searchEmpty")
                        : "Aucun résultat local"}
                    </CommandEmpty>
                    {!searchQuery && recentSearches.length > 0 && (
                      <CommandGroup heading="Recherches récentes">
                        {recentSearches.map((r) => (
                          <CommandItem
                            key={`${r.gameName}#${r.tagLine}-${r.region}`}
                            value={`${r.gameName}#${r.tagLine}`}
                            onSelect={() => {
                              setSearchRegion(r.region);
                              void handleSummonerSearch(
                                `${r.gameName}#${r.tagLine}`
                              );
                            }}
                            className="cursor-pointer"
                          >
                            <Avatar className="size-6 mr-2">
                              <AvatarFallback>
                                {r.gameName?.[0] || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {r.gameName}#{r.tagLine}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {r.region}
                              </Badge>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                    {searchResults.length > 0 && (
                      <CommandGroup heading="Résultats locaux">
                        {searchResults.map((result) => (
                          <CommandItem
                            key={result.puuid}
                            value={`${result.gameName || ""}#${
                              result.tagLine || ""
                            } ${result.puuid}`}
                            onSelect={() => {
                              router.push(
                                `/summoners/${result.puuid}/overview?region=${result.region}`
                              );
                              setSearchQuery("");
                              setSearchResults([]);
                            }}
                            className="cursor-pointer"
                          >
                            <Avatar className="size-6 mr-2">
                              {result.profileIconId ? (
                                <>
                                  <AvatarImage
                                    src={getProfileIconUrl(
                                      result.profileIconId
                                    )}
                                    alt="Profile Icon"
                                  />
                                  <AvatarFallback>
                                    {result.gameName?.[0] || "?"}
                                  </AvatarFallback>
                                </>
                              ) : (
                                <AvatarFallback>
                                  {result.gameName?.[0] || "?"}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="text-sm font-medium truncate">
                                {result.gameName}
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">
                                  #{result.tagLine}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {result.stats?.totalMatches || 0} games
                                </Badge>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                    {searchQuery && (
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => handleSummonerSearch(searchQuery)}
                          className="cursor-pointer"
                        >
                          <SearchIcon className="mr-2 h-4 w-4" />
                          {isSearching
                            ? t("header.searching")
                            : `${t("header.searchFor")} "${searchQuery}"`}
                          {isSearching && (
                            <Loader2Icon className="ml-auto h-4 w-4 animate-spin" />
                          )}
                        </CommandItem>
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </div>
            </PopoverContent>
          </Popover>
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
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
