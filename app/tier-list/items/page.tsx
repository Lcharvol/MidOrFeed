"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from "lucide-react";

interface Item {
  name: string;
  winRate: number;
  winRateIncrease: number;
  pickRate: number;
  pickRateIncrease: number;
}

// Données d'exemple d'objets de League of Legends
const items: Item[] = [
  {
    name: "Infinity Edge",
    winRate: 54.2,
    winRateIncrease: 2.1,
    pickRate: 35.8,
    pickRateIncrease: 5.3,
  },
  {
    name: "Duskblade of Draktharr",
    winRate: 51.8,
    winRateIncrease: 1.2,
    pickRate: 28.5,
    pickRateIncrease: 3.1,
  },
  {
    name: "Liandry's Anguish",
    winRate: 52.5,
    winRateIncrease: 0.8,
    pickRate: 31.2,
    pickRateIncrease: 1.5,
  },
  {
    name: "Goredrinker",
    winRate: 50.3,
    winRateIncrease: -0.5,
    pickRate: 22.4,
    pickRateIncrease: -2.3,
  },
  {
    name: "Shieldbow",
    winRate: 53.1,
    winRateIncrease: 3.2,
    pickRate: 26.9,
    pickRateIncrease: 4.8,
  },
  {
    name: "Luden's Tempest",
    winRate: 51.6,
    winRateIncrease: 1.8,
    pickRate: 29.7,
    pickRateIncrease: 2.2,
  },
  {
    name: "Sunfire Aegis",
    winRate: 49.8,
    winRateIncrease: -1.1,
    pickRate: 18.3,
    pickRateIncrease: -3.5,
  },
  {
    name: "Blade of the Ruined King",
    winRate: 52.9,
    winRateIncrease: 2.5,
    pickRate: 24.6,
    pickRateIncrease: 3.7,
  },
  {
    name: "Rabadon's Deathcap",
    winRate: 55.4,
    winRateIncrease: 0.7,
    pickRate: 19.8,
    pickRateIncrease: 1.9,
  },
  {
    name: "Bloodthirster",
    winRate: 50.7,
    winRateIncrease: 0.3,
    pickRate: 15.2,
    pickRateIncrease: -0.8,
  },
  {
    name: "Trinity Force",
    winRate: 51.2,
    winRateIncrease: 1.5,
    pickRate: 20.1,
    pickRateIncrease: 2.4,
  },
  {
    name: "Zhonya's Hourglass",
    winRate: 48.6,
    winRateIncrease: -2.3,
    pickRate: 32.5,
    pickRateIncrease: 0.1,
  },
  {
    name: "Void Staff",
    winRate: 52.3,
    winRateIncrease: 1.1,
    pickRate: 27.4,
    pickRateIncrease: 1.8,
  },
  {
    name: "Lord Dominik's Regards",
    winRate: 53.7,
    winRateIncrease: 2.8,
    pickRate: 23.8,
    pickRateIncrease: 4.1,
  },
  {
    name: "Death's Dance",
    winRate: 49.4,
    winRateIncrease: -0.9,
    pickRate: 16.7,
    pickRateIncrease: -1.7,
  },
];

type SortColumn =
  | "name"
  | "winRate"
  | "winRateIncrease"
  | "pickRate"
  | "pickRateIncrease";
type SortDirection = "asc" | "desc" | null;

export default function ItemsPage() {
  const [searchTerm, setSearchTerm] = useState("");
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

  const sortedAndFilteredItems = useMemo(() => {
    let filtered = items.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortColumn && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch (sortColumn) {
          case "name":
            aValue = a.name;
            bValue = b.name;
            break;
          case "winRate":
            aValue = a.winRate;
            bValue = b.winRate;
            break;
          case "winRateIncrease":
            aValue = a.winRateIncrease;
            bValue = b.winRateIncrease;
            break;
          case "pickRate":
            aValue = a.pickRate;
            bValue = b.pickRate;
            break;
          case "pickRateIncrease":
            aValue = a.pickRateIncrease;
            bValue = b.pickRateIncrease;
            break;
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [searchTerm, sortColumn, sortDirection]);

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column)
      return <ChevronsUpDownIcon className="ml-1 size-4 opacity-50" />;
    if (sortDirection === "asc") return <ArrowUpIcon className="ml-1 size-4" />;
    if (sortDirection === "desc")
      return <ArrowDownIcon className="ml-1 size-4" />;
    return <ChevronsUpDownIcon className="ml-1 size-4 opacity-50" />;
  };

  const formatChange = (value: number) => {
    const isPositive = value >= 0;
    const sign = isPositive ? "+" : "";
    const color = isPositive ? "text-green-500" : "text-red-500";
    return (
      <span className={color}>
        {sign}
        {value.toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold">Tier List - Objets</h1>
        <p className="text-muted-foreground">
          Les statistiques actuelles des objets de League of Legends
        </p>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Rechercher un objet..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:max-w-md"
        />
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
                  Nom de l&apos;objet
                  <SortIcon column="name" />
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
                onClick={() => handleSort("winRateIncrease")}
              >
                <div className="flex items-center">
                  Win Rate Increase
                  <SortIcon column="winRateIncrease" />
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
                onClick={() => handleSort("pickRateIncrease")}
              >
                <div className="flex items-center">
                  Pick Rate Increase
                  <SortIcon column="pickRateIncrease" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Aucun objet trouvé
                </TableCell>
              </TableRow>
            ) : (
              sortedAndFilteredItems.map((item) => (
                <TableRow key={item.name}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.winRate.toFixed(1)}%</TableCell>
                  <TableCell>{formatChange(item.winRateIncrease)}</TableCell>
                  <TableCell>{item.pickRate.toFixed(1)}%</TableCell>
                  <TableCell>{formatChange(item.pickRateIncrease)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        Affichage de {sortedAndFilteredItems.length} objet
        {sortedAndFilteredItems.length > 1 ? "s" : ""}
        {items.length > 0 && ` sur ${items.length}`}
      </div>
    </div>
  );
}
