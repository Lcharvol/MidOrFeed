"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsUpDownIcon,
} from "lucide-react";
import type { SortColumn, SortDirection } from "@/types";

type SortIndicatorProps = {
  column: SortColumn;
  sortColumn: SortColumn | null;
  sortDirection: SortDirection;
};

export const SortIndicator = ({
  column,
  sortColumn,
  sortDirection,
}: SortIndicatorProps) => {
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
