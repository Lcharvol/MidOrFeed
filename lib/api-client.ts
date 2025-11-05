// Utilitaire pour faire des requêtes API avec authentification automatique

/**
 * Fait une requête fetch avec l'authentification automatique
 * pour les routes admin
 */
export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  // Récupérer l'utilisateur depuis localStorage
  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;

  // Ajouter l'Authorization header si l'utilisateur est connecté
  const headers = new Headers(options.headers);
  if (user?.id) {
    headers.set("Authorization", `Bearer ${user.id}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
};
