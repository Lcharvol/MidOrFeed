"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", backgroundColor: "#0a0a0a", color: "#fafafa" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: "1rem" }}>
          <div style={{ maxWidth: "28rem", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>!</div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>
              Une erreur critique est survenue
            </h1>
            <p style={{ color: "#a1a1aa", marginBottom: "1.5rem" }}>
              Nous sommes désolés, quelque chose s&apos;est mal passé.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button
                onClick={reset}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "0.375rem",
                  border: "none",
                  backgroundColor: "#fafafa",
                  color: "#0a0a0a",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Réessayer
              </button>
              <a
                href="/"
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #27272a",
                  backgroundColor: "transparent",
                  color: "#fafafa",
                  fontWeight: 500,
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                Accueil
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
