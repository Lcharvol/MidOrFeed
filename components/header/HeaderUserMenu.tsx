"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
  HeartIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useRiotProfileIcon } from "@/lib/hooks/use-riot-profile-icon";
import { getInitials } from "@/lib/profile-utils";
import { useI18n } from "@/lib/i18n-context";

export function HeaderUserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { profileIconUrl, isLoading: isLoadingIcon } = useRiotProfileIcon(
    user?.leagueAccount?.puuid,
    user?.leagueAccount?.riotRegion
  );
  const { t } = useI18n();

  const handleLogout = () => {
    logout();
    toast.success(t("header.logoutSuccessful"));
    router.push("/");
  };

  if (user) {
    return (
      <>
        <Separator
          orientation="vertical"
          className="hidden sm:block h-6"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background outline-none" aria-label="Menu utilisateur">
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
              <Link href="/favorites" className="cursor-pointer">
                <HeartIcon className="mr-2 size-4" />
                Mes Favoris
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
    );
  }

  return (
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
  );
}
