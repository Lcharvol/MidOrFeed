/**
 * Wrappers pour le lazy loading des composants lourds
 */

import { Loader2 } from "lucide-react";

/**
 * Loading component pour les composants lazy loaded
 * Compatible avec Next.js dynamic loading props
 */
export const LazyLoadingFallback = () => (
  <div
    className="flex items-center justify-center p-8"
    aria-label="Chargement..."
  >
    <Loader2 className="size-6 animate-spin text-muted-foreground" />
  </div>
);

