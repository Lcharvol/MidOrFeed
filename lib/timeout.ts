/**
 * Utilitaires pour gérer les timeouts
 */

/**
 * Crée une promesse qui se résout après le délai spécifié
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Crée une promesse avec timeout
 * @param promise La promesse à exécuter
 * @param ms Timeout en millisecondes
 * @param errorMessage Message d'erreur personnalisé
 * @returns La promesse avec timeout
 */
export const withTimeout = <T>(
  promise: Promise<T>,
  ms: number,
  errorMessage = `Opération expirée après ${ms}ms`
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), ms)
    ),
  ]);
};

/**
 * Wrapper pour fetch avec timeout
 * @param url URL à récupérer
 * @param options Options de fetch
 * @param timeoutMs Timeout en millisecondes (défaut: 10s)
 * @returns Réponse fetch
 */
export const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeoutMs = 10000
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Requête expirée après ${timeoutMs}ms: ${url}`);
    }
    throw error;
  }
};

/**
 * Wrapper pour Prisma avec timeout
 * @param operation Opération Prisma à exécuter
 * @param timeoutMs Timeout en millisecondes (défaut: 30s)
 * @returns Résultat de l'opération
 */
export const prismaWithTimeout = async <T>(
  operation: () => Promise<T>,
  timeoutMs = 30000
): Promise<T> => {
  return withTimeout(
    operation(),
    timeoutMs,
    `Opération base de données expirée après ${timeoutMs}ms`
  );
};

