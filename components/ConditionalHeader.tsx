"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";

export function ConditionalHeader() {
  const pathname = usePathname();

  // Ne pas afficher le header sur les pages login et signup
  const hideHeader = pathname === "/login" || pathname === "/signup";

  if (hideHeader) {
    return null;
  }

  return <Header />;
}
