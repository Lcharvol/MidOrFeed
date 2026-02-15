"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RiotAccountSection } from "@/components/RiotAccountSection";
import { MailIcon, UserIcon, HashIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";

interface User {
  id: string;
  email: string;
  name: string | null;
  riotPuuid?: string | null;
  riotRegion?: string | null;
}

interface AccountTabProps {
  user: User;
}

export function AccountTab({ user }: AccountTabProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="size-5 text-primary" />
            {t("profile.account.personalInfoTitle")}
          </CardTitle>
          <CardDescription>
            {t("profile.account.personalInfoDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <UserIcon className="size-3.5" />
                {t("profile.account.name")}
              </label>
              <p className="text-sm font-medium">
                {user.name || t("profile.account.notProvided")}
              </p>
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <MailIcon className="size-3.5" />
                {t("profile.account.email")}
              </label>
              <p className="text-sm font-medium">{user.email}</p>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <HashIcon className="size-3.5" />
                {t("profile.account.userId")}
              </label>
              <p className="text-sm font-mono text-muted-foreground">
                {user.id}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Riot Account */}
      <RiotAccountSection className="mt-0" />
    </div>
  );
}
