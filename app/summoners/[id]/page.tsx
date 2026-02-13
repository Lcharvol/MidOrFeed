import { redirect } from "next/navigation";

type Params = {
  id: string;
};

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

/**
 * Redirect /summoners/[id] to /summoners/[id]/overview
 * Server-side redirect for better SEO and performance.
 */
export default async function SummonerRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const query = new URLSearchParams(
    Object.entries(resolvedSearchParams)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, Array.isArray(v) ? v[0] : v] as [string, string])
  ).toString();

  redirect(`/summoners/${id}/overview${query ? `?${query}` : ""}`);
}
