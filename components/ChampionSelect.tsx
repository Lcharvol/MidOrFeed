"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChampionIcon } from "@/components/ChampionIcon";
import { CheckIcon, SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ChampionOption = {
  id: string;
  name: string;
};

type ChampionSelectProps = {
  options: ChampionOption[];
  value: string | null;
  onChange: (championId: string) => void;
  placeholder?: string;
  label?: string;
};

export const ChampionSelect = ({
  options,
  value,
  onChange,
  placeholder = "Sélectionne un champion",
  label,
}: ChampionSelectProps) => {
  const [open, setOpen] = useState(false);

  const optionsById = useMemo(() => {
    const entries = options.map<[string, ChampionOption]>((option) => [
      option.id,
      option,
    ]);
    return new Map(entries);
  }, [options]);

  const selectedOption = value ? optionsById.get(value) ?? null : null;

  const handleSelect = (championId: string) => {
    onChange(championId);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      {label && (
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          {label}
        </p>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-between text-left font-normal",
              !selectedOption && "text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <SearchIcon className="size-4 text-muted-foreground" />
              {selectedOption ? selectedOption.name : placeholder}
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(320px,90vw)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Rechercher un champion..." />
            <CommandList>
              <CommandEmpty>Aucun champion trouvé.</CommandEmpty>
              <CommandGroup heading="Champions">
                {options.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={option.id}
                    onSelect={() => handleSelect(option.id)}
                    className="flex items-center gap-2"
                  >
                    <ChampionIcon
                      championId={option.id}
                      size={36}
                      shape="rounded"
                      className="border border-border/40"
                    />
                    <span className="flex-1">{option.name}</span>
                    {value === option.id && (
                      <CheckIcon className="size-4 text-primary" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

