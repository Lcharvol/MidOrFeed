"use client";

import useSWR, { type SWRConfiguration, type Key } from "swr";

const defaultFetcher = (url: string) =>
  fetch(url).then((response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json();
  });

const DEFAULT_CONFIG: SWRConfiguration = {
  fetcher: defaultFetcher,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  shouldRetryOnError: false,
  dedupingInterval: 30_000,
};

export const useApiSWR = <Data = unknown, Error = unknown>(
  key: Key,
  config?: SWRConfiguration<Data, Error>
) => useSWR<Data, Error>(key, { ...DEFAULT_CONFIG, ...config });


