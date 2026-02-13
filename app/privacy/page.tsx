import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy – Mid or Feed",
  description: "Privacy policy for Mid or Feed, a League of Legends companion tool.",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-3xl py-16 px-4">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <p className="text-muted-foreground mb-4">Last updated: February 2026</p>

      <section className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <h2 className="text-xl font-semibold text-foreground">1. Data we collect</h2>
        <p>
          We collect publicly available League of Legends summoner data through the Riot Games API
          (summoner names, match history, rankings). We also collect basic analytics data (page
          views, device type) to improve the service.
        </p>

        <h2 className="text-xl font-semibold text-foreground">2. How we use your data</h2>
        <p>
          Data is used exclusively to provide statistics, tier lists, and match analysis. We do not
          sell personal data to third parties.
        </p>

        <h2 className="text-xl font-semibold text-foreground">3. Cookies</h2>
        <p>
          We use essential cookies for authentication and preferences (theme, language). Third-party
          analytics cookies may be used to understand usage patterns.
        </p>

        <h2 className="text-xl font-semibold text-foreground">4. Contact</h2>
        <p>
          For any privacy-related questions, reach out on our{" "}
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
