"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  RefreshCwIcon,
  SparklesIcon,
} from "lucide-react";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  subscriptionTier: string;
  dailyAnalysesUsed: number;
  dailyAnalysisLimit: number;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type Pagination = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

const formatRelativeDate = (dateString: string | null, t: (key: string) => string): string => {
  if (!dateString) return t("admin.rights.never");

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t("admin.rights.justNow");
  if (diffMins < 60) return t("admin.rights.minutesAgo").replace("{n}", String(diffMins));
  if (diffHours < 24) return t("admin.rights.hoursAgo").replace("{n}", String(diffHours));
  if (diffDays < 7) return t("admin.rights.daysAgo").replace("{n}", String(diffDays));

  return date.toLocaleDateString();
};

export const RightsTab = () => {
  const { t } = useI18n();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [filter, setFilter] = useState("");
  const [debouncedFilter, setDebouncedFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingLimitId, setEditingLimitId] = useState<string | null>(null);
  const [editingLimitValue, setEditingLimitValue] = useState<string>("");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0,
  });

  // Debounce filter input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilter(filter);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [filter]);

  const fetchUsers = useCallback(async (page: number, search: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pagination.pageSize),
      });
      if (search) params.set("search", search);

      const res = await authenticatedFetch(`/api/admin/users?${params}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as {
        success?: boolean;
        users?: UserRow[];
        pagination?: Pagination;
      };
      if (res.ok && json.users) {
        setUsers(json.users);
        if (json.pagination) {
          setPagination(json.pagination);
        }
      } else {
        toast.error(t("admin.rights.errorLoadingUsers"));
      }
    } catch {
      toast.error(t("admin.rights.networkError"));
    } finally {
      setLoading(false);
    }
  }, [pagination.pageSize, t]);

  useEffect(() => {
    fetchUsers(pagination.page, debouncedFilter);
  }, [pagination.page, debouncedFilter, fetchUsers]);

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

  const updateDailyLimit = async (userId: string, limit: number) => {
    setUpdatingId(userId);
    try {
      const res = await authenticatedFetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, dailyAnalysisLimit: limit }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json?.error || t("admin.rights.updateFailed"));
        return;
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, dailyAnalysisLimit: limit } : u
        )
      );
      toast.success(t("admin.rights.limitUpdated"));
    } catch {
      toast.error(t("admin.rights.networkError"));
    } finally {
      setUpdatingId(null);
      setEditingLimitId(null);
    }
  };

  const handleLimitKeyDown = (e: React.KeyboardEvent, userId: string) => {
    if (e.key === "Enter") {
      const limit = parseInt(editingLimitValue, 10);
      if (!isNaN(limit) && limit >= 0 && limit <= 1000) {
        updateDailyLimit(userId, limit);
      }
    } else if (e.key === "Escape") {
      setEditingLimitId(null);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page }));
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
        <Button
          variant="outline"
          onClick={() => fetchUsers(pagination.page, debouncedFilter)}
          disabled={loading}
        >
          <RefreshCwIcon className={`size-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {t("admin.rights.reload")}
        </Button>
        <div className="ml-auto text-sm text-muted-foreground">
          {pagination.totalCount} {t("admin.rights.usersTotal")}
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
        <div className="grid grid-cols-12 px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/40">
          <div className="col-span-3">{t("admin.rights.email")}</div>
          <div className="col-span-2">{t("admin.rights.name")}</div>
          <div className="col-span-1">{t("admin.rights.role")}</div>
          <div className="col-span-2">{t("admin.rights.aiLimit")}</div>
          <div className="col-span-2">{t("admin.rights.lastLogin")}</div>
          <div className="col-span-2 text-right">{t("admin.rights.actions")}</div>
        </div>
        {loading && users.length === 0 ? (
          <div className="px-3 py-6 text-sm text-muted-foreground text-center">
            {t("admin.rights.loading")}
          </div>
        ) : users.length === 0 ? (
          <div className="px-3 py-6 text-sm text-muted-foreground text-center">
            {t("admin.rights.noUsers")}
          </div>
        ) : (
          <ul className={loading ? "opacity-50" : ""}>
            {users.map((u) => (
              <li
                key={u.id}
                className="grid grid-cols-12 items-center px-3 py-2 border-t text-sm"
              >
                <div className="col-span-3 truncate" title={u.email}>
                  {u.email}
                </div>
                <div className="col-span-2 truncate">{u.name ?? "—"}</div>
                <div className="col-span-1">
                  <Badge variant={u.role === "admin" ? "default" : "outline"}>
                    {u.role}
                  </Badge>
                </div>
                <div className="col-span-2">
                  {editingLimitId === u.id ? (
                    <Input
                      type="number"
                      min={0}
                      max={1000}
                      value={editingLimitValue}
                      onChange={(e) => setEditingLimitValue(e.target.value)}
                      onKeyDown={(e) => handleLimitKeyDown(e, u.id)}
                      onBlur={() => setEditingLimitId(null)}
                      className="w-20 h-7 text-xs"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => {
                        setEditingLimitId(u.id);
                        setEditingLimitValue(String(u.dailyAnalysisLimit));
                      }}
                      className="flex items-center gap-1.5 text-xs hover:bg-muted px-2 py-1 rounded transition-colors"
                      title={t("admin.rights.clickToEdit")}
                    >
                      <SparklesIcon className="size-3 text-amber-500" />
                      <span>
                        {u.dailyAnalysesUsed}/{u.dailyAnalysisLimit}
                      </span>
                    </button>
                  )}
                </div>
                <div className="col-span-2 text-xs text-muted-foreground">
                  {formatRelativeDate(u.lastLoginAt, t)}
                </div>
                <div className="col-span-2 flex justify-end gap-2">
                  <Select
                    value={u.role}
                    onValueChange={(val) => updateRole(u.id, val)}
                    disabled={updatingId === u.id}
                  >
                    <SelectTrigger className="w-[100px] h-8">
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

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {t("admin.rights.page")} {pagination.page} / {pagination.totalPages}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => goToPage(1)}
              disabled={pagination.page === 1 || loading}
            >
              <ChevronsLeftIcon className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page === 1 || loading}
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <div className="flex items-center gap-1 mx-2">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum: number;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === pagination.page ? "default" : "outline"}
                    size="icon"
                    className="size-8"
                    onClick={() => goToPage(pageNum)}
                    disabled={loading}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages || loading}
            >
              <ChevronRightIcon className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => goToPage(pagination.totalPages)}
              disabled={pagination.page === pagination.totalPages || loading}
            >
              <ChevronsRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
