type ChampionJsonLdProps = {
  data: Record<string, unknown>;
};

export const ChampionJsonLd = ({ data }: ChampionJsonLdProps) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
  />
);
