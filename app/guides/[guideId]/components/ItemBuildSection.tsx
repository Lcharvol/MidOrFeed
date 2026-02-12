"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ItemIcon } from "@/components/ItemIcon";
import { SwordIcon } from "lucide-react";
import type { ItemBuildConfig } from "@/types/guides";

export const ItemBuildSection = ({ build }: { build: ItemBuildConfig }) => {
  const hasItems =
    build.starter.length > 0 ||
    build.core.length > 0 ||
    build.situational.length > 0 ||
    build.boots.length > 0;

  if (!hasItems) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SwordIcon className="size-5" />
          Build Items
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {build.starter.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Items de départ
            </h4>
            <div className="flex flex-wrap gap-2">
              {build.starter.map((itemId, i) => (
                <ItemIcon key={i} itemId={itemId} size={40} />
              ))}
            </div>
          </div>
        )}

        {build.core.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Items core
            </h4>
            <div className="flex flex-wrap gap-2">
              {build.core.map((itemId, i) => (
                <ItemIcon key={i} itemId={itemId} size={40} />
              ))}
            </div>
          </div>
        )}

        {build.situational.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Items situationnels
            </h4>
            <div className="flex flex-wrap gap-2">
              {build.situational.map((itemId, i) => (
                <ItemIcon key={i} itemId={itemId} size={40} />
              ))}
            </div>
          </div>
        )}

        {build.boots.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Bottes
            </h4>
            <div className="flex flex-wrap gap-2">
              {build.boots.map((itemId, i) => (
                <ItemIcon key={i} itemId={itemId} size={40} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
