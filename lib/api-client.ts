// Utilitaire pour faire des requêtes API avec authentification automatique

/**
 * Fait une requête fetch avec l'authentification automatique via JWT
 * pour les routes protégées
 */
export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  // Récupérer le token JWT depuis localStorage
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Ajouter l'Authorization header si un token existe
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
};
