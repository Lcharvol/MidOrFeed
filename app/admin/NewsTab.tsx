"use client";

import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n-context";
import {
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  RefreshCwIcon,
} from "lucide-react";

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  imageUrl: string | null;
  externalUrl: string | null;
  publishedAt: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type Pagination = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

type FormData = {
  title: string;
  excerpt: string;
  imageUrl: string;
  externalUrl: string;
  status: string;
  publishedAt: string;
};

const emptyForm: FormData = {
  title: "",
  excerpt: "",
  imageUrl: "",
  externalUrl: "",
  status: "draft",
  publishedAt: "",
};

function formatDate(dateString: string | null): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const NewsTab = () => {
  const { t } = useI18n();
  const [articles, setArticles] = useState<Article[]>([]);
  const [filter, setFilter] = useState("");
  const [debouncedFilter, setDebouncedFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilter(filter);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [filter]);

  const fetchArticles = useCallback(
    async (page: number, search: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pagination.pageSize),
        });
        if (search) params.set("search", search);

        const res = await authenticatedFetch(`/api/admin/news?${params}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (res.ok && json.articles) {
          setArticles(json.articles);
          if (json.pagination) setPagination(json.pagination);
        } else {
          toast.error(t("admin.news.errorLoading"));
        }
      } catch {
        toast.error(t("admin.news.networkError"));
      } finally {
        setLoading(false);
      }
    },
    [pagination.pageSize, t]
  );

  useEffect(() => {
    fetchArticles(pagination.page, debouncedFilter);
  }, [pagination.page, debouncedFilter, fetchArticles]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (article: Article) => {
    setEditingId(article.id);
    setForm({
      title: article.title,
      excerpt: article.excerpt ?? "",
      imageUrl: article.imageUrl ?? "",
      externalUrl: article.externalUrl ?? "",
      status: article.status,
      publishedAt: article.publishedAt
        ? new Date(article.publishedAt).toISOString().slice(0, 16)
        : "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);

    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        excerpt: form.excerpt || undefined,
        imageUrl: form.imageUrl || undefined,
        externalUrl: form.externalUrl || undefined,
        status: form.status,
        publishedAt: form.publishedAt
          ? new Date(form.publishedAt).toISOString()
          : null,
      };

      const url = editingId
        ? `/api/admin/news/${editingId}`
        : "/api/admin/news";
      const method = editingId ? "PUT" : "POST";

      const res = await authenticatedFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json?.error || t("admin.news.saveFailed"));
        return;
      }

      toast.success(
        editingId
          ? t("admin.news.articleUpdated")
          : t("admin.news.articleCreated")
      );
      setDialogOpen(false);
      fetchArticles(pagination.page, debouncedFilter);
    } catch {
      toast.error(t("admin.news.networkError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await authenticatedFetch(`/api/admin/news/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error(t("admin.news.deleteFailed"));
        return;
      }
      toast.success(t("admin.news.articleDeleted"));
      setDeleteConfirmId(null);
      fetchArticles(pagination.page, debouncedFilter);
    } catch {
      toast.error(t("admin.news.networkError"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder={t("admin.news.searchPlaceholder")}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full sm:max-w-sm"
        />
        <Button
          variant="outline"
          onClick={() => fetchArticles(pagination.page, debouncedFilter)}
          disabled={loading}
        >
          <RefreshCwIcon
            className={`size-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          {t("admin.rights.reload")}
        </Button>
        <div className="sm:ml-auto">
          <Button onClick={openCreate}>
            <PlusIcon className="size-4 mr-2" />
            {t("admin.news.addArticle")}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="rounded-md border overflow-hidden min-w-[600px]">
          <div className="grid grid-cols-12 px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/40">
            <div className="col-span-4">{t("admin.news.title")}</div>
            <div className="col-span-2">{t("admin.news.status")}</div>
            <div className="col-span-3">{t("admin.news.publishDate")}</div>
            <div className="col-span-3 text-right">
              {t("admin.rights.actions")}
            </div>
          </div>
          {loading && articles.length === 0 ? (
            <div className="px-3 py-6 text-sm text-muted-foreground text-center">
              {t("common.loading")}
            </div>
          ) : articles.length === 0 ? (
            <div className="px-3 py-6 text-sm text-muted-foreground text-center">
              {t("admin.news.noArticles")}
            </div>
          ) : (
            <ul className={loading ? "opacity-50" : ""}>
              {articles.map((a) => (
                <li
                  key={a.id}
                  className="grid grid-cols-12 items-center px-3 py-2 border-t text-sm"
                >
                  <div className="col-span-4 truncate" title={a.title}>
                    {a.title}
                  </div>
                  <div className="col-span-2">
                    <Badge
                      variant={
                        a.status === "published" ? "default" : "outline"
                      }
                    >
                      {t(`admin.news.${a.status}`)}
                    </Badge>
                  </div>
                  <div className="col-span-3 text-xs text-muted-foreground">
                    {formatDate(a.publishedAt)}
                  </div>
                  <div className="col-span-3 flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => openEdit(a)}
                    >
                      <PencilIcon className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive"
                      onClick={() => setDeleteConfirmId(a.id)}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {t("admin.rights.page")} {pagination.page} / {pagination.totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1 || loading}
              onClick={() =>
                setPagination((p) => ({ ...p, page: p.page - 1 }))
              }
            >
              {t("common.back")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.totalPages || loading}
              onClick={() =>
                setPagination((p) => ({ ...p, page: p.page + 1 }))
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId
                ? t("admin.news.editArticle")
                : t("admin.news.addArticle")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("admin.news.title")}</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Patch 14.10 Notes"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.news.excerpt")}</Label>
              <Textarea
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.news.imageUrl")}</Label>
              <Input
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://images.contentstack.io/..."
              />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.news.externalUrl")}</Label>
              <Input
                value={form.externalUrl}
                onChange={(e) => setForm({ ...form, externalUrl: e.target.value })}
                placeholder="https://www.leagueoflegends.com/fr-fr/news/..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("admin.news.status")}</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">
                      {t("admin.news.draft")}
                    </SelectItem>
                    <SelectItem value="published">
                      {t("admin.news.published")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("admin.news.publishDate")}</Label>
                <Input
                  type="datetime-local"
                  value={form.publishedAt}
                  onChange={(e) =>
                    setForm({ ...form, publishedAt: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.title.trim()}
            >
              {saving ? t("common.loading") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("admin.news.confirmDelete")}</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
