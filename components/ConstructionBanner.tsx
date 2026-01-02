"use client";

import { useState, useEffect } from "react";
import { ConstructionIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "construction-banner-dismissed";

export function ConstructionBanner() {
  const [dismissed, setDismissed] = useState(true); // Start hidden to avoid flash

  useEffect(() => {
    const isDismissed = localStorage.getItem(STORAGE_KEY) === "true";
    setDismissed(isDismissed);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  if (dismissed) {
    return null;
  }

  return (
    <div className="bg-warning-muted/50 border-b border-warning/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-1.5">
          <div className="flex items-center gap-2 text-xs text-warning-muted-foreground">
            <ConstructionIcon className="size-3.5" />
            <span>
              Site en construction — certaines fonctionnalités peuvent être instables
            </span>
          </div>
          <button
            onClick={handleDismiss}
            className={cn(
              "p-1 rounded-md transition-colors",
              "text-warning-muted-foreground/70 hover:text-warning-muted-foreground",
              "hover:bg-warning/10"
            )}
            aria-label="Fermer"
          >
            <XIcon className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
