"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsUpDownIcon,
  Loader2Icon,
} from "lucide-react";

// Interface basée sur les données Riot
interface Item {
  id: string;
  itemId: string;
  name: string;
  description: string | null;
  plaintext: string | null;
  image: string | null;
  gold: string | null; // JSON string avec {base, total, sell}
}

interface ItemsResponse {
  success: boolean;
  data: Item[];
  count: number;
}

type SortColumn = "name" | "gold";
type SortDirection = "asc" | "desc" | null;

const fetcher = async (url: string): Promise<ItemsResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Erreur lors de la récupération des items");
  }
  return res.json();
};

// Composant SortIcon défini en dehors du composant principal
const SortIcon = ({
  column,
  sortColumn,
  sortDirection,
}: {
  column: SortColumn;
  sortColumn: SortColumn | null;
  sortDirection: SortDirection;
}) => {
  if (sortColumn !== column)
    return <ChevronsUpDownIcon className="ml-1 size-4 opacity-50" />;
  if (sortDirection === "asc") return <ArrowUpIcon className="ml-1 size-4" />;
  if (sortDirection === "desc")
    return <ArrowDownIcon className="ml-1 size-4" />;
  return <ChevronsUpDownIcon className="ml-1 size-4 opacity-50" />;
};

export default function ItemsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const { data, error, isLoading } = useSWR<ItemsResponse>(
    "/api/items/list",
    fetcher
  );

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortColumn(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedAndFilteredItems = useMemo(() => {
    if (!data?.data) return [];

    let filtered = data.data.filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesSearch;
    });

    if (sortColumn && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch (sortColumn) {
          case "name":
            aValue = a.name;
            bValue = b.name;
            break;
          case "gold":
            // Parse gold JSON to get total value
            const aGold = a.gold ? JSON.parse(a.gold) : { total: 0 };
            const bGold = b.gold ? JSON.parse(b.gold) : { total: 0 };
            aValue = aGold.total || 0;
            bValue = bGold.total || 0;
            break;
          default:
            aValue = 0;
            bValue = 0;
        }

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        } else if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, sortColumn, sortDirection]);

  const getGoldValue = (gold: string | null): string => {
    if (!gold) return "N/A";
    try {
      const parsed = JSON.parse(gold);
      return `${parsed.total} gold`;
    } catch {
      return gold;
    }
  };

  const getPlaintextPreview = (text: string | null): string => {
    if (!text) return "-";
    // Remove HTML tags
    const plain = text.replace(/<[^>]*>/g, "");
    return plain.length > 80 ? `${plain.substring(0, 80)}...` : plain;
  };

  const cleanItemName = (name: string | null): string => {
    if (!name) return "N/A";
    // Remove HTML tags from name
    return name.replace(/<[^>]*>/g, "");
  };

  const getItemImageUrl = (image: string | null): string => {
    if (!image) return "";
    // L'image de Riot contient déjà le nom complet (ex: "1001.png")
    // On construit l'URL complète Data Dragon
    // Pour obtenir la version, on pourrait la récupérer depuis l'API ou utiliser une version fixe
    const version = "15.21.1"; // Version actuelle, à faire dynamique si besoin
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${image}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold">Items</h1>
        <p className="text-muted-foreground">
          Tous les objets de League of Legends avec leurs statistiques
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Input
            placeholder="Rechercher un item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2Icon className="size-8 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center">
          <p className="text-destructive">
            Erreur lors du chargement des items
          </p>
        </div>
      )}

      {!isLoading && !error && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Image</TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    Nom
                    <SortIcon
                      column="name"
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                    />
                  </div>
                </TableHead>
                <TableHead>Description</TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("gold")}
                >
                  <div className="flex items-center">
                    Prix
                    <SortIcon
                      column="gold"
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                    />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFilteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Aucun item trouvé
                  </TableCell>
                </TableRow>
              ) : (
                sortedAndFilteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.image ? (
                        <Image
                          src={getItemImageUrl(item.image)}
                          alt={cleanItemName(item.name)}
                          width={48}
                          height={48}
                          className="rounded"
                        />
                      ) : (
                        <div className="size-12 rounded bg-muted" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {cleanItemName(item.name)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-md">
                      {getPlaintextPreview(item.plaintext)}
                    </TableCell>
                    <TableCell className="flex items-center justify-end gap-2">
                      {getGoldValue(item.gold)}
                      <Image
                        src="/gold-piece.png"
                        alt="Gold"
                        width={20}
                        height={20}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {!isLoading && !error && (
        <div className="mt-4 text-sm text-muted-foreground">
          Affichage de {sortedAndFilteredItems.length} item
          {sortedAndFilteredItems.length > 1 ? "s" : ""}
          {data && ` sur ${data.count}`}
        </div>
      )}
    </div>
  );
}
