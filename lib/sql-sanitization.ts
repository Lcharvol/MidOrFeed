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


