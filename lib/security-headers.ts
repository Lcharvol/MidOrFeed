import { NextResponse } from "next/server";
import { isProduction } from "./env";

/**
 * Headers de sécurité à appliquer aux réponses HTTP
 */
export const securityHeaders = {
  /**
   * Empêche le chargement de la page dans une iframe (protection contre clickjacking)
   */
  "X-Frame-Options": "DENY",

  /**
   * Empêche le navigateur de détecter automatiquement le type MIME
   */
  "X-Content-Type-Options": "nosniff",

  /**
   * Active le filtre XSS du navigateur
   */
  "X-XSS-Protection": "1; mode=block",

  /**
   * Politique de référent (ne pas envoyer d'informations sur l'origine)
   */
  "Referrer-Policy": "strict-origin-when-cross-origin",

  /**
   * Permissions Policy (anciennement Feature Policy)
   * Désactive les fonctionnalités non nécessaires
   */
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",

  /**
   * Strict Transport Security (HSTS)
   * Force l'utilisation de HTTPS (uniquement en production)
   */
  ...(isProduction() && {
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  }),

  /**
   * Cross-Origin Opener Policy
   * Empêche les attaques via window.opener (moins restrictif que same-origin pour permettre les images externes)
   */
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",

  // Note: Cross-Origin-Embedder-Policy (COEP) et Cross-Origin-Resource-Policy (CORP) sont retirés
  // car trop restrictifs et bloquent les images depuis Data Dragon CDN qui ne renvoie pas
  // les headers CORS appropriés. Ces headers sont principalement nécessaires pour SharedArrayBuffer
  // qui n'est pas utilisé dans cette application.
} as const;

/**
 * Content Security Policy en mode strict
 * En production, ajustez selon vos besoins
 */
export const getContentSecurityPolicy = (): string => {
  if (isProduction()) {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://www.gstatic.com", // Google OAuth nécessite unsafe-inline
      "style-src 'self' 'unsafe-inline'", // Tailwind nécessite unsafe-inline
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.riotgames.com https://ddragon.leagueoflegends.com https://accounts.google.com",
      "frame-src https://accounts.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
      "block-all-mixed-content", // Bloquer le contenu mixte (HTTP sur HTTPS)
    ].join("; ");
  }

  // En développement, on autorise plus de choses pour faciliter le développement
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https: http: ws: wss:",
    "frame-src 'self' https:",
  ].join("; ");
};

/**
 * Applique les headers de sécurité à une réponse Next.js
 */
export const applySecurityHeaders = (response: NextResponse): NextResponse => {
  // Appliquer les headers de sécurité
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Appliquer la Content Security Policy
  response.headers.set("Content-Security-Policy", getContentSecurityPolicy());

  return response;
};

/**
 * Middleware pour appliquer les headers de sécurité automatiquement
 * Utiliser dans next.config.js ou dans un middleware Next.js
 */
export const securityHeadersMiddleware = (
  headers: Headers,
  isProductionEnv: boolean = isProduction()
): void => {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  headers.set("Content-Security-Policy", getContentSecurityPolicy());
};
