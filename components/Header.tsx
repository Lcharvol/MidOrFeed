"use client";

import { useState, useEffect } from "react";
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
import { useAuth } from "@/lib/auth-context";
import {
  LogOutIcon,
  SettingsIcon,
  UserIcon,
  Loader2Icon,
  MoonIcon,
  SunIcon,
  SearchIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useRiotProfileIcon } from "@/lib/hooks/use-riot-profile-icon";
import { getInitials } from "@/lib/profile-utils";
import { useI18n } from "@/lib/i18n-context";
import { RIOT_REGIONS } from "@/lib/riot-regions";

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchRegion, setSearchRegion] = useState("euw1");
  const [isSearching, setIsSearching] = useState(false);
  const { profileIconUrl, isLoading: isLoadingIcon } = useRiotProfileIcon(
    user?.riotPuuid,
    user?.riotRegion
  );
  const { t } = useI18n();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success(t("header.logoutSuccessful"));
    router.push("/");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

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

      // Redirect to summoner page with the found PUUID
      router.push(`/summoners?puuid=${result.puuid}&region=${region}`);
    } catch (error) {
      console.error("Search error:", error);
      toast.error(t("header.searchError"));
    } finally {
      setIsSearching(false);
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="MidOrFeed"
              width={40}
              height={140}
              className="w-auto"
              priority
            />
          </Link>

          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>
                  {t("compositions.menu")}
                </NavigationMenuTrigger>
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
                <NavigationMenuTrigger>
                  {t("tierListMenu.title")}
                </NavigationMenuTrigger>
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

              {user && (
                <NavigationMenuItem>
                  <Link
                    href="/summoners"
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  >
                    {t("header.monProfil")}
                  </Link>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <SearchIcon className="h-5 w-5" />
                <span className="sr-only">{t("header.searchSummoner")}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-3" align="end">
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
                    <CommandEmpty>{t("header.searchEmpty")}</CommandEmpty>
                    <CommandGroup heading={t("header.searchInstructions")}>
                      <CommandItem>
                        <div className="flex flex-col gap-1">
                          <p className="text-xs text-muted-foreground">
                            {t("header.searchFormat")}
                          </p>
                          <p className="text-xs font-mono bg-muted px-2 py-1 rounded">
                            GameName#TagLine
                          </p>
                        </div>
                      </CommandItem>
                    </CommandGroup>
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

          {/* Theme Toggle */}
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
              <Separator orientation="vertical" className="h-6" />
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
              <Button variant="ghost" asChild>
                <Link href="/login">{t("header.login")}</Link>
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button asChild>
                <Link href="/signup">{t("header.signup")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
