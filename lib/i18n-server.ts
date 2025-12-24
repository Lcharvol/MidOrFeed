/**
 * Utilitaire pour l'internationalisation côté serveur
 * Permet de récupérer les traductions dans les routes API
 */

import messagesFr from "@/messages/fr.json";
import messagesEn from "@/messages/en.json";

type Messages = typeof messagesFr;

/**
 * Récupère les messages traduits pour une locale donnée
 */
const getMessagesForLocale = (locale: string): Messages => {
  switch (locale) {
    case "en":
      return messagesEn as Messages;
    case "fr":
    default:
      return messagesFr;
  }
};

/**
 * Récupère une traduction par clé (ex: "signup.nameMinCharacters")
 * Supporte les clés imbriquées avec des points (ex: "signup.nameMinCharacters")
 */
export const getTranslation = (
  key: string,
  locale: string = "fr"
): string => {
  const messages = getMessagesForLocale(locale);
  const keys = key.split(".");

  let value: unknown = messages;
  for (const k of keys) {
    if (typeof value === "object" && value !== null && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key; // Retourner la clé si la traduction n'est pas trouvée
    }
  }

  return typeof value === "string" ? value : key;
};

/**
 * Récupère la locale depuis les headers de la requête
 * Par défaut: "fr"
 */
export const getLocaleFromRequest = (headers: Headers): string => {
  const acceptLanguage = headers.get("accept-language");
  if (acceptLanguage?.includes("en")) {
    return "en";
  }
  return "fr";
};

/**
 * Crée une fonction de traduction pour une locale donnée
 * Utile pour créer des schémas Zod avec messages traduits
 */
export const createTranslator = (locale: string = "fr") => {
  return (key: string): string => getTranslation(key, locale);
};

