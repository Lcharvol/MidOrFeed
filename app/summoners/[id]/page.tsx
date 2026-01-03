"use client";

import { useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

/**
 * Redirect /summoners/[id] to /summoners/[id]/overview
 * Preserves query parameters like region
 */
export default function SummonerRedirectPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const id = params?.id;
    if (id) {
      const query = searchParams.toString();
      const url = `/summoners/${id}/overview${query ? `?${query}` : ""}`;
      router.replace(url);
    }
  }, [params, searchParams, router]);

  return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-pulse text-muted-foreground">
        Chargement du profil...
      </div>
    </div>
  );
}
