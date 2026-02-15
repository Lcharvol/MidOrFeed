"use client";

import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { NewspaperIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";

type NewsArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  imageUrl: string | null;
  externalUrl: string | null;
  publishedAt: string | null;
};

type NewsSectionProps = {
  articles: NewsArticle[];
  isLoading: boolean;
};

function formatDate(dateString: string | null): string {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function FeaturedCard({ article }: { article: NewsArticle }) {
  const card = (
    <Card className="relative overflow-hidden group h-full min-h-[300px] lg:min-h-[400px] cursor-pointer">
      {article.imageUrl ? (
        <Image
          src={article.imageUrl}
          alt={article.title}
          fill
          priority
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 1024px) 100vw, 66vw"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
        <p className="text-xs text-white/70 mb-2">{formatDate(article.publishedAt)}</p>
        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white leading-tight line-clamp-3">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-sm text-white/70 mt-2 line-clamp-2 hidden sm:block">
            {article.excerpt}
          </p>
        )}
      </div>
    </Card>
  );

  if (article.externalUrl) {
    return (
      <a href={article.externalUrl} target="_blank" rel="noopener noreferrer" className="block h-full">
        {card}
      </a>
    );
  }

  return card;
}

function SmallCard({ article }: { article: NewsArticle }) {
  const card = (
    <Card className="relative overflow-hidden group flex-1 min-h-[180px] cursor-pointer">
      {article.imageUrl ? (
        <Image
          src={article.imageUrl}
          alt={article.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 1024px) 100vw, 33vw"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-xs text-white/70 mb-1">{formatDate(article.publishedAt)}</p>
        <h3 className="text-sm sm:text-base font-bold text-white leading-tight line-clamp-2">
          {article.title}
        </h3>
      </div>
    </Card>
  );

  if (article.externalUrl) {
    return (
      <a href={article.externalUrl} target="_blank" rel="noopener noreferrer" className="flex flex-1">
        {card}
      </a>
    );
  }

  return card;
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
      <Skeleton className="h-[300px] lg:h-[400px] rounded-xl" />
      <div className="flex flex-col gap-4">
        <Skeleton className="flex-1 min-h-[180px] rounded-xl" />
        <Skeleton className="flex-1 min-h-[180px] rounded-xl" />
      </div>
    </div>
  );
}

export const NewsSection = ({ articles, isLoading }: NewsSectionProps) => {
  const { t } = useI18n();

  if (isLoading) {
    return (
      <section className="py-14 md:py-20 bg-gradient-to-b from-muted/30 to-background border-y">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl flex items-center gap-2">
                <NewspaperIcon className="size-6 text-primary" />
                {t("news.latestNews")}
              </h2>
            </div>
          </div>
          <LoadingSkeleton />
        </div>
      </section>
    );
  }

  if (articles.length === 0) return null;

  const featured = articles[0];
  const side = articles.slice(1, 3);

  return (
    <section className="py-14 md:py-20 bg-gradient-to-b from-muted/30 to-background border-y">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl flex items-center gap-2">
              <NewspaperIcon className="size-6 text-primary" />
              {t("news.latestNews")}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
          {featured && <FeaturedCard article={featured} />}
          {side.length > 0 && (
            <div className="flex flex-col gap-4">
              {side.map((article) => (
                <SmallCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
