"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { UserIcon, ShieldCheckIcon, DownloadIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { isAdmin } from "@/types/roles";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";
import {
  NavEntry,
  NavGroup,
  navigationTriggerClasses,
  navigationLinkClasses,
  standaloneNavLinkClasses,
  activeTriggerClass,
  activeLinkClass,
  desktopIconClass,
} from "./header-types";

export function HeaderNavigation({
  dropdownGroups,
}: {
  dropdownGroups: NavGroup[];
}) {
  const { user } = useAuth();
  const pathname = usePathname();
  const { t } = useI18n();

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

  return (
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

      <NavigationMenuItem>
        <Link
          href="/download"
          className={cn(
            standaloneNavLinkClasses,
            pathname === "/download" && activeTriggerClass
          )}
        >
          <DownloadIcon className="size-4" />
          Overlay
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
}
