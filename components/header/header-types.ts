import type { LucideIcon } from "lucide-react";

export type NavEntry = {
  key: string;
  href: string;
  icon: LucideIcon;
  title: string;
  description?: string;
  isActive: (path?: string | null) => boolean;
};

export type NavGroup = {
  key: string;
  label: string;
  icon: LucideIcon;
  entries: NavEntry[];
  isActive: (path?: string | null) => boolean;
};

export const navigationTriggerClasses =
  "group inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary data-[state=open]:bg-primary/10 data-[state=open]:text-primary";

export const navigationLinkClasses =
  "flex gap-3 select-none rounded-md p-3 leading-none text-sm text-muted-foreground no-underline outline-none transition-colors hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary";

export const standaloneNavLinkClasses =
  "flex items-center gap-2 select-none rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus:bg-primary/15 focus:text-primary";

export const mobileLinkClasses =
  "flex items-center gap-2 rounded-md px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary";

export const mobilePrimaryLinkClasses =
  "flex items-center gap-2 rounded-md px-4 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary";

export const activeTriggerClass = "bg-primary/10 text-primary shadow-sm";

export const activeLinkClass =
  "border border-primary/40 bg-primary/10 text-primary shadow";

export const desktopIconClass = "mt-0.5 size-5 text-primary shrink-0";

export const mobileIconClass = "size-4 text-primary";
