"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth-context";
import { isAdmin } from "@/types/roles";
import {
  UserIcon,
  MenuIcon,
  ShieldCheckIcon,
  DownloadIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
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
import {
  NavEntry,
  NavGroup,
  mobileLinkClasses,
  mobilePrimaryLinkClasses,
  mobileIconClass,
} from "./header-types";

export function HeaderMobileMenu({
  dropdownGroups,
  mobileMenuOpen,
  setMobileMenuOpen,
}: {
  dropdownGroups: NavGroup[];
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const pathname = usePathname();
  const { t } = useI18n();

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

  return (
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

            <Link
              href="/download"
              className={cn(
                mobilePrimaryLinkClasses,
                pathname === "/download" && "bg-primary/10 text-primary"
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              <DownloadIcon className="size-4" />
              Telecharger l'Overlay
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
                    pathname?.startsWith("/summoners") &&
                      "bg-primary/10 text-primary"
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
                      pathname?.startsWith("/admin") &&
                        "bg-primary/10 text-primary"
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
