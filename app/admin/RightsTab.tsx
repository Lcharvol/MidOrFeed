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
      else toast.error("Erreur lors du chargement des utilisateurs");
    } catch {
      toast.error("Erreur réseau");
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
        toast.error(json?.error || "Échec mise à jour");
        return;
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role } : u))
      );
      toast.success("Rôle mis à jour");
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Filtrer par email ou nom"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={fetchUsers} disabled={loading}>
          Recharger
        </Button>
      </div>

      <div className="rounded-md border overflow-hidden">
        <div className="grid grid-cols-12 px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/40">
          <div className="col-span-4">Email</div>
          <div className="col-span-2">Nom</div>
          <div className="col-span-2">Rôle</div>
          <div className="col-span-2">Abonnement</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        {filtered.length === 0 ? (
          <div className="px-3 py-6 text-sm text-muted-foreground">
            Aucun utilisateur
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
