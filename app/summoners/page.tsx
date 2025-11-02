"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SummonersPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/summoners/overview");
  }, [router]);

  return null;
}
