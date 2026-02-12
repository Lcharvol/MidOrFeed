"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsUpDownIcon,
} from "lucide-react";
import type { ItemSortColumn, SortDirection } from "@/types";

type ItemSortIndicatorProps = {
  column: ItemSortColumn;
  sortColumn: ItemSortColumn | null;
  sortDirection: SortDirection;
};

export const ItemSortIndicator = ({
  column,
  sortColumn,
  sortDirection,
}: ItemSortIndicatorProps) => {
  if (sortColumn !== column) {
    return (
      <>
        <ChevronsUpDownIcon className="ml-1 size-4 opacity-50" aria-hidden="true" />
        <span className="sr-only">Non trié</span>
      </>
    );
  }
  if (sortDirection === "asc") {
    return (
      <>
        <ArrowUpIcon className="ml-1 size-4" aria-hidden="true" />
        <span className="sr-only">Trié par ordre croissant</span>
      </>
    );
  }
  if (sortDirection === "desc") {
    return (
      <>
        <ArrowDownIcon className="ml-1 size-4" aria-hidden="true" />
        <span className="sr-only">Trié par ordre décroissant</span>
      </>
    );
  }
  return (
    <>
      <ChevronsUpDownIcon className="ml-1 size-4 opacity-50" aria-hidden="true" />
      <span className="sr-only">Non trié</span>
    </>
  );
};
