import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const articles = [
  {
    title: "Patch 26.3 Notes",
    slug: "patch-26-3-notes",
    excerpt:
      "Célébrez la nouvelle année et plongez-vous dans le patch 26.3 !",
    imageUrl:
      "https://cmsassets.rgpub.io/sanity/images/dsfx7636/news_live/26009ed5cbbbf58f100561ac6d54d06e88b39afe-1920x1080.jpg",
    externalUrl:
      "https://www.leagueoflegends.com/fr-fr/news/game-updates/patch-26-3-notes/",
    status: "published",
    publishedAt: new Date("2026-02-03T12:00:00Z"),
  },
  {
    title: "Patch 26.2 Notes",
    slug: "patch-26-2-notes",
    excerpt: "Patch 26.2 paré au décollage !",
    imageUrl:
      "https://cmsassets.rgpub.io/sanity/images/dsfx7636/news_live/8450bda0b6eb809ffb11c0161157d2e0b4d692d8-1920x1080.jpg",
    externalUrl:
      "https://www.leagueoflegends.com/fr-fr/news/game-updates/patch-26-2-notes/",
    status: "published",
    publishedAt: new Date("2026-01-21T12:00:00Z"),
  },
  {
    title: "Patch 26.1 Notes",
    slug: "patch-26-1-notes",
    excerpt: "Demacia arrive dans le patch 26.1 !",
    imageUrl:
      "https://cmsassets.rgpub.io/sanity/images/dsfx7636/news_live/dae5b2dc2bf5472edc69262a289e065394ee790b-1920x1080.jpg",
    externalUrl:
      "https://www.leagueoflegends.com/fr-fr/news/game-updates/patch-26-1-notes/",
    status: "published",
    publishedAt: new Date("2026-01-07T12:00:00Z"),
  },
];

async function main() {
  for (const article of articles) {
    const result = await prisma.newsArticle.upsert({
      where: { slug: article.slug },
      update: {
        title: article.title,
        excerpt: article.excerpt,
        imageUrl: article.imageUrl,
        status: article.status,
        publishedAt: article.publishedAt,
      },
      create: article,
    });
    console.log(`✓ ${result.title} (${result.slug})`);
  }
  console.log("\nDone — 3 articles seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
