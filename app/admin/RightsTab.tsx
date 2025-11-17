"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n-context";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  subscriptionTier: string;
  createdAt: string;
  updatedAt: string;
};

export const RightsTab = () => {
  const { t } = useI18n();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await authenticatedFetch("/api/admin/users", {
        cache: "no-store",
      });
      const json = (await res.json()) as {
        success?: boolean;
        users?: UserRow[];
      };
      if (res.ok && json.users) setUsers(json.users);
      else toast.error(t("admin.rights.errorLoadingUsers"));
    } catch {
      toast.error(t("admin.rights.networkError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.name ?? "").toLowerCase().includes(q)
    );
  }, [filter, users]);

  const updateRole = async (userId: string, role: string) => {
    setUpdatingId(userId);
    try {
      const res = await authenticatedFetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json?.error || t("admin.rights.updateFailed"));
        return;
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role } : u))
      );
      toast.success(t("admin.rights.roleUpdated"));
    } catch {
      toast.error(t("admin.rights.networkError"));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder={t("admin.rights.filterPlaceholder")}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={fetchUsers} disabled={loading}>
          {t("admin.rights.reload")}
        </Button>
      </div>

      <div className="rounded-md border overflow-hidden">
        <div className="grid grid-cols-12 px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/40">
          <div className="col-span-4">{t("admin.rights.email")}</div>
          <div className="col-span-2">{t("admin.rights.name")}</div>
          <div className="col-span-2">{t("admin.rights.role")}</div>
          <div className="col-span-2">{t("admin.rights.subscription")}</div>
          <div className="col-span-2 text-right">{t("admin.rights.actions")}</div>
        </div>
        {filtered.length === 0 ? (
          <div className="px-3 py-6 text-sm text-muted-foreground">
            {t("admin.rights.noUsers")}
          </div>
        ) : (
          <ul>
            {filtered.map((u) => (
              <li
                key={u.id}
                className="grid grid-cols-12 items-center px-3 py-2 border-t text-sm"
              >
                <div className="col-span-4 truncate">{u.email}</div>
                <div className="col-span-2 truncate">{u.name ?? "—"}</div>
                <div className="col-span-2">
                  <Badge variant={u.role === "admin" ? "default" : "outline"}>
                    {u.role}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <Badge variant="outline">{u.subscriptionTier}</Badge>
                </div>
                <div className="col-span-2 flex justify-end gap-2">
                  <Select
                    value={u.role}
                    onValueChange={(val) => updateRole(u.id, val)}
                    disabled={updatingId === u.id}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">user</SelectItem>
                      <SelectItem value="admin">admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
