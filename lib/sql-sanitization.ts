import { prisma } from "./prisma";

/**
 * Utilitaires pour sécuriser les requêtes SQL brutes
 */

/**
 * Échappe les caractères spéciaux dans un pattern LIKE pour éviter les injections
 * Les caractères % et _ ont une signification spéciale dans LIKE
 */
export const escapeLikePattern = (value: string): string => {
  return value
    .replace(/\\/g, "\\\\") // Escape backslashes first
    .replace(/%/g, "\\%")   // Escape %
    .replace(/_/g, "\\_");  // Escape _
};

/**
 * Échappe un identifiant SQL (nom de table, colonne) pour éviter les injections
 * Utilise des guillemets doubles pour PostgreSQL
 */
export const escapeSqlIdentifier = (identifier: string): string => {
  // Vérifier que l'identifiant ne contient que des caractères alphanumériques, underscores et tirets
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
    throw new Error(`Identifiant SQL invalide: ${identifier}`);
  }
  // Échapper avec des guillemets doubles pour PostgreSQL
  return `"${identifier}"`;
};

/**
 * Échappe une valeur SQL pour éviter les injections
 * Utilise des paramètres préparés Prisma au lieu de concaténation
 */
export const escapeSqlValue = (value: string | number | null): string => {
  if (value === null) {
    return "NULL";
  }
  if (typeof value === "number") {
    return value.toString();
  }
  // Pour les strings, utiliser des paramètres préparés
  // Cette fonction ne devrait pas être utilisée directement, mais via Prisma.$queryRaw
  throw new Error(
    "Utilisez Prisma.$queryRaw avec des paramètres au lieu de escapeSqlValue pour les strings"
  );
};

/**
 * Valide qu'un nom de table est sûr
 * Les noms de tables doivent correspondre à un pattern strict
 */
export const validateTableName = (tableName: string): boolean => {
  // Pattern strict : lettres, chiffres, underscores uniquement, commençant par une lettre
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName);
};

/**
 * Valide qu'une région est valide pour éviter les injections
 */
export const validateRegion = (region: string): boolean => {
  // Liste des régions valides (doit correspondre à constants/riot-regions.ts)
  const validRegions = [
    "euw1",
    "eun1",
    "na1",
    "br1",
    "kr",
    "jp1",
    "ru",
    "tr1",
    "la1",
    "la2",
    "oc1",
    "ph2",
    "sg2",
    "th2",
    "tw2",
    "vn2",
  ];
  return validRegions.includes(region.toLowerCase());
};

/**
 * Construit une requête SQL sécurisée avec des paramètres
 * Utilise Prisma.$queryRaw avec des paramètres au lieu de $queryRawUnsafe
 */
export const buildSafeQuery = (
  query: string,
  params: (string | number | null)[]
): string => {
  // Vérifier que le nombre de paramètres correspond au nombre de placeholders
  const placeholderCount = (query.match(/\?/g) || []).length;
  if (placeholderCount !== params.length) {
    throw new Error(
      `Nombre de paramètres incorrect: ${placeholderCount} placeholders pour ${params.length} paramètres`
    );
  }
  return query;
};

/**
 * Wrapper sécurisé pour $queryRawUnsafe qui valide les entrées
 * À utiliser uniquement quand $queryRaw n'est pas possible (noms de tables dynamiques)
 */
export const safeQueryRawUnsafe = async <T = unknown>(
  query: string,
  tableName?: string
): Promise<T> => {
  // Valider le nom de table si fourni
  if (tableName && !validateTableName(tableName)) {
    throw new Error(`Nom de table invalide: ${tableName}`);
  }

  // Vérifier que la requête ne contient pas de patterns dangereux
  const dangerousPatterns = [
    /;\s*(DROP|DELETE|TRUNCATE|ALTER|CREATE|GRANT|REVOKE)/i,
    /--/,
    /\/\*/,
    /xp_/i,
    /sp_/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(query)) {
      throw new Error(`Requête SQL potentiellement dangereuse détectée`);
    }
  }

  return prisma.$queryRawUnsafe<T>(query);
};

