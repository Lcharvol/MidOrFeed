"use client";

import Link from "next/link";
import { SparklesIcon, ChevronRightIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import type { NewsArticle } from "./types";

type AnnouncementBannerProps = {
  article: NewsArticle | null;
};

export const AnnouncementBanner = ({ article }: AnnouncementBannerProps) => {
  const { t } = useI18n();

  if (!article) return null;

  return (
    <div className="w-full bg-black/90 border-b border-amber-500/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-2.5 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <SparklesIcon className="size-4 shrink-0 text-amber-400" />
            <span className="font-bold text-amber-400 text-sm uppercase tracking-wide shrink-0">
              {article.title}
            </span>
            {article.excerpt && (
              <span className="text-white/80 text-sm truncate hidden sm:inline">
                {article.excerpt}
              </span>
            )}
          </div>
          <Link
            href="#"
            className="flex items-center gap-1 text-sm font-semibold text-white hover:text-amber-400 transition-colors shrink-0"
          >
            {t("news.readMore")}
            <ChevronRightIcon className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
