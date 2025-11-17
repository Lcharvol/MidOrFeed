/**
 * Wrappers pour le lazy loading des composants lourds
 */

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

/**
 * Loading component pour les composants lazy loaded
 */
export const LazyLoadingFallback = ({
  className = "",
}: {
  className?: string;
}) => (
  <div
    className={`flex items-center justify-center p-8 ${className}`}
    aria-label="Chargement..."
  >
    <Loader2 className="size-6 animate-spin text-muted-foreground" />
  </div>
);

/**
 * Lazy load les composants avec un fallback de chargement
 */
export const lazyLoad = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options?: {
    loading?: React.ComponentType;
    ssr?: boolean;
  }
) => {
  return dynamic(importFunc, {
    loading: options?.loading || LazyLoadingFallback,
    ssr: options?.ssr !== false,
  });
};

