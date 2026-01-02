// Utilitaire pour faire des requêtes API avec authentification automatique

const CSRF_COOKIE_NAME = "csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Get CSRF token from cookies
 */
const getCsrfToken = (): string | null => {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === CSRF_COOKIE_NAME) {
      return decodeURIComponent(value);
    }
  }
  return null;
};

/**
 * Fait une requête fetch avec l'authentification automatique via JWT
 * pour les routes protégées. Inclut automatiquement le token CSRF
 * pour les requêtes mutatives (POST, PUT, DELETE, PATCH).
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

  // Add CSRF token for mutative requests
  const method = (options.method || "GET").toUpperCase();
  if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers.set(CSRF_HEADER_NAME, csrfToken);
    }
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: "include", // Important: include cookies in request
  });
};
