import { useCallback, useState } from "react";

export type RecentSearch = {
  gameName: string;
  tagLine: string;
  region: string;
  puuid: string;
  timestamp: number;
};

const STORAGE_KEY = "recentSearches";
const MAX_ENTRIES = 5;

export const useRecentSearch = () => {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as RecentSearch[]) : [];
      return Array.isArray(parsed) ? parsed.slice(0, MAX_ENTRIES) : [];
    } catch {
      return [];
    }
  });

  const persist = useCallback((entries: RecentSearch[]) => {
    setRecentSearches(entries);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      } catch {
        // ignore
      }
    }
  }, []);

  const addRecentSearch = useCallback(
    (gameName: string, tagLine: string, region: string, puuid: string) => {
      const entry: RecentSearch = {
        gameName: gameName.trim(),
        tagLine: tagLine.trim(),
        region,
        puuid,
        timestamp: Date.now(),
      };
      const key = `${entry.gameName.toLowerCase()}#${entry.tagLine.toLowerCase()}@${
        entry.region
      }`;
      const next = [
        entry,
        ...recentSearches.filter(
          (r) =>
            `${r.gameName.toLowerCase()}#${r.tagLine.toLowerCase()}@${
              r.region
            }` !== key
        ),
      ].slice(0, MAX_ENTRIES);
      persist(next);
    },
    [recentSearches, persist]
  );

  return { recentSearches, addRecentSearch };
};
