"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ItemIcon } from "@/components/ItemIcon";
import { useApiSWR, STATIC_DATA_CONFIG } from "@/lib/hooks/swr";
import { PlusIcon, SearchIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Item {
  id: string;
  itemId: string;
  name: string;
  description?: string | null;
  plaintext?: string | null;
  gold?: string | null;
}

interface ItemsResponse {
  success: boolean;
  data: Item[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ItemSelectorProps {
  selectedItems: string[];
  onItemsChange: (items: string[]) => void;
  maxItems?: number;
  label?: string;
  placeholder?: string;
  className?: string;
}

export const ItemSelector = ({
  selectedItems,
  onItemsChange,
  maxItems = 6,
  label,
  placeholder = "Ajouter un item",
  className,
}: ItemSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Fetch all items (they're static, so we fetch a large batch)
  const { data: itemsData, isLoading } = useApiSWR<ItemsResponse>(
    "/api/items/list?limit=500",
    STATIC_DATA_CONFIG
  );

  const allItems = itemsData?.data ?? [];

  // Filter items by search
  const filteredItems = useMemo(() => {
    if (!search.trim()) return allItems;
    const searchLower = search.toLowerCase();
    return allItems.filter(
      (item) =>
        item.name.toLowerCase().includes(searchLower) ||
        item.plaintext?.toLowerCase().includes(searchLower)
    );
  }, [allItems, search]);

  // Get selected item objects
  const selectedItemObjects = useMemo(() => {
    return selectedItems
      .map((itemId) => allItems.find((i) => i.itemId === itemId))
      .filter(Boolean) as Item[];
  }, [selectedItems, allItems]);

  const handleSelectItem = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      // Remove if already selected
      onItemsChange(selectedItems.filter((id) => id !== itemId));
    } else if (selectedItems.length < maxItems) {
      // Add if not at max
      onItemsChange([...selectedItems, itemId]);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    onItemsChange(selectedItems.filter((id) => id !== itemId));
  };

  const canAddMore = selectedItems.length < maxItems;

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium text-muted-foreground">
          {label}
        </label>
      )}

      {/* Selected items display */}
      <div className="flex flex-wrap gap-2">
        {selectedItemObjects.map((item) => (
          <div
            key={item.itemId}
            className="relative group"
            title={item.name}
          >
            <ItemIcon itemId={item.itemId} size={44} />
            <button
              type="button"
              onClick={() => handleRemoveItem(item.itemId)}
              className="absolute -top-1 -right-1 size-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <XIcon className="size-3" />
            </button>
          </div>
        ))}

        {/* Add button */}
        {canAddMore && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="size-11 p-0"
                title={placeholder}
              >
                <PlusIcon className="size-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Sélectionner un item</DialogTitle>
              </DialogHeader>

              {/* Search */}
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un item..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>

              {/* Items grid */}
              <ScrollArea className="h-[400px] pr-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    Chargement...
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    Aucun item trouvé
                  </div>
                ) : (
                  <div className="grid grid-cols-8 gap-2">
                    {filteredItems.map((item) => {
                      const isSelected = selectedItems.includes(item.itemId);
                      return (
                        <button
                          key={item.itemId}
                          type="button"
                          onClick={() => {
                            handleSelectItem(item.itemId);
                            if (!isSelected) setOpen(false);
                          }}
                          className={cn(
                            "relative p-1 rounded-md transition-colors",
                            isSelected
                              ? "bg-primary/20 ring-2 ring-primary"
                              : "hover:bg-muted"
                          )}
                          title={item.name}
                        >
                          <ItemIcon itemId={item.itemId} size={40} />
                          {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center bg-primary/40 rounded-md">
                              <XIcon className="size-4 text-primary-foreground" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              <div className="text-sm text-muted-foreground text-center">
                {selectedItems.length}/{maxItems} items sélectionnés
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};
