"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
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
interface Champion {
  id: string;
  championId: string;
  name: string;
  title: string;
  blurb: string | null;
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
  hp: number;
  hpPerLevel: number;
  mp: number | null;
  mpPerLevel: number | null;
  moveSpeed: number;
  armor: number;
  armorPerLevel: number;
  spellBlock: number;
  spellBlockPerLevel: number;
  attackRange: number;
  hpRegen: number;
  hpRegenPerLevel: number;
  mpRegen: number | null;
  mpRegenPerLevel: number | null;
  crit: number;
  critPerLevel: number;
  attackDamage: number;
  attackDamagePerLevel: number;
  attackSpeed: number;
  attackSpeedPerLevel: number;
}

interface ChampionsResponse {
  success: boolean;
  data: Champion[];
  count: number;
}

type SortColumn =
  | "name"
  | "attack"
  | "defense"
  | "magic"
  | "difficulty"
  | "hp"
  | "moveSpeed";
type SortDirection = "asc" | "desc" | null;

const fetcher = async (url: string): Promise<ChampionsResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Erreur lors de la récupération des champions");
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

export default function ChampionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Utiliser SWR pour fetch les champions
  const { data, error, isLoading } = useSWR<ChampionsResponse>(
    "/api/champions/list",
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

  const getDifficultyBadgeVariant = (difficulty: number) => {
    if (difficulty >= 8) return "destructive";
    if (difficulty >= 6) return "default";
    if (difficulty >= 4) return "secondary";
    return "outline";
  };

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty >= 8) return "Expert";
    if (difficulty >= 6) return "Avancé";
    if (difficulty >= 4) return "Moyen";
    return "Débutant";
  };

  const sortedAndFilteredChampions = useMemo(() => {
    if (!data?.data) return [];

    let filtered = data.data.filter((champion) => {
      const matchesSearch = champion.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesSearch;
    });

    if (sortColumn && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];

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

  const getChampionImageUrl = (championId: string): string => {
    // Les images de champions Riot suivent ce pattern:
    // https://ddragon.leagueoflegends.com/cdn/{version}/img/champion/{championId}.png
    const version = "15.21.1"; // Version actuelle, à faire dynamique si besoin
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championId}.png`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold">Champions</h1>
        <p className="text-muted-foreground">
          Tous les champions de League of Legends avec leurs statistiques
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Input
            placeholder="Rechercher un champion..."
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
            Erreur lors du chargement des champions
          </p>
        </div>
      )}

      {!isLoading && !error && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Image</TableHead>
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
                <TableHead>Titre</TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("difficulty")}
                >
                  <div className="flex items-center">
                    Difficulté
                    <SortIcon
                      column="difficulty"
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                    />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("attack")}
                >
                  <div className="flex items-center">
                    Attaque
                    <SortIcon
                      column="attack"
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                    />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("defense")}
                >
                  <div className="flex items-center">
                    Défense
                    <SortIcon
                      column="defense"
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                    />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("magic")}
                >
                  <div className="flex items-center">
                    Magie
                    <SortIcon
                      column="magic"
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                    />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("hp")}
                >
                  <div className="flex items-center">
                    HP
                    <SortIcon
                      column="hp"
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                    />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFilteredChampions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Aucun champion trouvé
                  </TableCell>
                </TableRow>
              ) : (
                sortedAndFilteredChampions.map((champion) => (
                  <TableRow key={champion.id}>
                    <TableCell>
                      <Image
                        src={getChampionImageUrl(champion.championId)}
                        alt={champion.name}
                        width={56}
                        height={56}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {champion.name}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {champion.title}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getDifficultyBadgeVariant(champion.difficulty)}
                      >
                        {getDifficultyLabel(champion.difficulty)}
                      </Badge>
                    </TableCell>
                    <TableCell>{champion.attack}</TableCell>
                    <TableCell>{champion.defense}</TableCell>
                    <TableCell>{champion.magic}</TableCell>
                    <TableCell>{Math.round(champion.hp)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {!isLoading && !error && (
        <div className="mt-4 text-sm text-muted-foreground">
          Affichage de {sortedAndFilteredChampions.length} champion
          {sortedAndFilteredChampions.length > 1 ? "s" : ""}
          {data && ` sur ${data.count}`}
        </div>
      )}
    </div>
  );
}
