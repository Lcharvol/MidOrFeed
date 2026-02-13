import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service – Mid or Feed",
  description: "Terms of service for Mid or Feed, a League of Legends companion tool.",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-3xl py-16 px-4">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>

      <p className="text-muted-foreground mb-4">Last updated: February 2026</p>

      <section className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <h2 className="text-xl font-semibold text-foreground">1. Acceptance</h2>
        <p>
          By using Mid or Feed you agree to these terms. If you do not agree, please stop using the
          service.
        </p>

        <h2 className="text-xl font-semibold text-foreground">2. Service description</h2>
        <p>
          Mid or Feed provides League of Legends statistics, tier lists, counter-pick suggestions,
          and match analysis based on publicly available Riot Games API data.
        </p>

        <h2 className="text-xl font-semibold text-foreground">3. Riot Games</h2>
        <p>
          Mid or Feed isn&apos;t endorsed by Riot Games and doesn&apos;t reflect the views or
          opinions of Riot Games or anyone officially involved in producing or managing League of
          Legends.
        </p>

        <h2 className="text-xl font-semibold text-foreground">4. Limitation of liability</h2>
        <p>
          The service is provided &quot;as is&quot; without warranty. We are not liable for any
          damages arising from use of the service.
        </p>

        <h2 className="text-xl font-semibold text-foreground">5. Contact</h2>
        <p>
          For questions about these terms, reach out on our{" "}
          <a
            href="https://discord.gg/midorfeed"
            className="text-primary underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Discord server
          </a>
          .
        </p>
      </section>
    </div>
  );
}
