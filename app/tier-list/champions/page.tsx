"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from "lucide-react";

type Tier = "S+" | "S" | "A+" | "A" | "B+" | "B" | "C+" | "C";
type Role = "Top" | "Mid" | "ADC" | "Support" | "Jungle";

interface Champion {
  name: string;
  tier: Tier;
  winRate: number;
  pickRate: number;
  banRate: number;
  role: Role;
}

// Données d'exemple de champions de League of Legends
const champions: Champion[] = [
  {
    name: "Jinx",
    tier: "S+",
    winRate: 52.3,
    pickRate: 18.5,
    banRate: 25.2,
    role: "ADC",
  },
  {
    name: "Yasuo",
    tier: "S",
    winRate: 50.1,
    pickRate: 22.3,
    banRate: 35.7,
    role: "Mid",
  },
  {
    name: "Thresh",
    tier: "A+",
    winRate: 49.8,
    pickRate: 15.2,
    banRate: 18.9,
    role: "Support",
  },
  {
    name: "Jax",
    tier: "S",
    winRate: 51.2,
    pickRate: 16.8,
    banRate: 12.5,
    role: "Top",
  },
  {
    name: "Lee Sin",
    tier: "A+",
    winRate: 48.9,
    pickRate: 19.4,
    banRate: 8.3,
    role: "Jungle",
  },
  {
    name: "Lux",
    tier: "A",
    winRate: 51.5,
    pickRate: 14.6,
    banRate: 15.1,
    role: "Mid",
  },
  {
    name: "Ezreal",
    tier: "S",
    winRate: 49.2,
    pickRate: 20.7,
    banRate: 3.1,
    role: "ADC",
  },
  {
    name: "Annie",
    tier: "B+",
    winRate: 50.8,
    pickRate: 8.3,
    banRate: 5.2,
    role: "Mid",
  },
  {
    name: "Garen",
    tier: "A",
    winRate: 52.1,
    pickRate: 12.4,
    banRate: 2.8,
    role: "Top",
  },
  {
    name: "Soraka",
    tier: "A+",
    winRate: 48.6,
    pickRate: 11.2,
    banRate: 4.5,
    role: "Support",
  },
  {
    name: "Master Yi",
    tier: "B",
    winRate: 47.8,
    pickRate: 13.5,
    banRate: 22.4,
    role: "Jungle",
  },
  {
    name: "Ashe",
    tier: "A",
    winRate: 50.3,
    pickRate: 10.8,
    banRate: 1.9,
    role: "ADC",
  },
  {
    name: "Blitzcrank",
    tier: "B+",
    winRate: 49.1,
    pickRate: 9.7,
    banRate: 31.2,
    role: "Support",
  },
  {
    name: "Darius",
    tier: "S",
    winRate: 51.9,
    pickRate: 17.3,
    banRate: 28.6,
    role: "Top",
  },
  {
    name: "Zed",
    tier: "A+",
    winRate: 48.4,
    pickRate: 21.6,
    banRate: 42.1,
    role: "Mid",
  },
];

type SortColumn = "name" | "tier" | "winRate" | "pickRate" | "banRate" | "role";
type SortDirection = "asc" | "desc" | null;

export default function ChampionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "All">("All");
  const [tierFilter, setTierFilter] = useState<Tier | "All">("All");
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

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

  const getTierBadgeVariant = (tier: Tier) => {
    if (tier.includes("S+")) return "default"; // Gold
    if (tier.includes("S")) return "default"; // Gold
    if (tier.includes("A+")) return "secondary";
    if (tier.includes("A")) return "secondary";
    return "outline";
  };

  const sortedAndFilteredChampions = useMemo(() => {
    let filtered = champions.filter((champion) => {
      const matchesSearch = champion.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "All" || champion.role === roleFilter;
      const matchesTier = tierFilter === "All" || champion.tier === tierFilter;

      return matchesSearch && matchesRole && matchesTier;
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
          case "tier":
            const tierOrder: Record<Tier, number> = {
              "S+": 0,
              S: 1,
              "A+": 2,
              A: 3,
              "B+": 4,
              B: 5,
              "C+": 6,
              C: 7,
            };
            aValue = tierOrder[a.tier];
            bValue = tierOrder[b.tier];
            break;
          case "winRate":
            aValue = a.winRate;
            bValue = b.winRate;
            break;
          case "pickRate":
            aValue = a.pickRate;
            bValue = b.pickRate;
            break;
          case "banRate":
            aValue = a.banRate;
            bValue = b.banRate;
            break;
          case "role":
            aValue = a.role;
            bValue = b.role;
            break;
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [searchTerm, roleFilter, tierFilter, sortColumn, sortDirection]);

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column)
      return <ChevronsUpDownIcon className="ml-1 size-4 opacity-50" />;
    if (sortDirection === "asc") return <ArrowUpIcon className="ml-1 size-4" />;
    if (sortDirection === "desc")
      return <ArrowDownIcon className="ml-1 size-4" />;
    return <ChevronsUpDownIcon className="ml-1 size-4 opacity-50" />;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold">Tier List - Champions</h1>
        <p className="text-muted-foreground">
          Les statistiques actuelles des champions de League of Legends
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
        <Select
          value={roleFilter}
          onValueChange={(value) => setRoleFilter(value as Role | "All")}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">Tous les rôles</SelectItem>
            <SelectItem value="Top">Top</SelectItem>
            <SelectItem value="Mid">Mid</SelectItem>
            <SelectItem value="ADC">ADC</SelectItem>
            <SelectItem value="Support">Support</SelectItem>
            <SelectItem value="Jungle">Jungle</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={tierFilter}
          onValueChange={(value) => setTierFilter(value as Tier | "All")}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">Tous les tiers</SelectItem>
            <SelectItem value="S+">S+</SelectItem>
            <SelectItem value="S">S</SelectItem>
            <SelectItem value="A+">A+</SelectItem>
            <SelectItem value="A">A</SelectItem>
            <SelectItem value="B+">B+</SelectItem>
            <SelectItem value="B">B</SelectItem>
            <SelectItem value="C+">C+</SelectItem>
            <SelectItem value="C">C</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center">
                  Nom
                  <SortIcon column="name" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("tier")}
              >
                <div className="flex items-center">
                  Tier
                  <SortIcon column="tier" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("winRate")}
              >
                <div className="flex items-center">
                  Win Rate
                  <SortIcon column="winRate" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("pickRate")}
              >
                <div className="flex items-center">
                  Pick Rate
                  <SortIcon column="pickRate" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("banRate")}
              >
                <div className="flex items-center">
                  Ban Rate
                  <SortIcon column="banRate" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("role")}
              >
                <div className="flex items-center">
                  Rôle
                  <SortIcon column="role" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredChampions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Aucun champion trouvé
                </TableCell>
              </TableRow>
            ) : (
              sortedAndFilteredChampions.map((champion) => (
                <TableRow key={champion.name}>
                  <TableCell className="font-medium">{champion.name}</TableCell>
                  <TableCell>
                    <Badge variant={getTierBadgeVariant(champion.tier)}>
                      {champion.tier}
                    </Badge>
                  </TableCell>
                  <TableCell>{champion.winRate.toFixed(1)}%</TableCell>
                  <TableCell>{champion.pickRate.toFixed(1)}%</TableCell>
                  <TableCell>{champion.banRate.toFixed(1)}%</TableCell>
                  <TableCell>{champion.role}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        Affichage de {sortedAndFilteredChampions.length} champion
        {sortedAndFilteredChampions.length > 1 ? "s" : ""}
        {champions.length > 0 && ` sur ${champions.length}`}
      </div>
    </div>
  );
}
