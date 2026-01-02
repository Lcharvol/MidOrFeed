import { createLogoutResponse } from "@/lib/jwt";

/**
 * POST /api/auth/logout
 * Clears the HTTP-only auth cookie
 */
export async function POST() {
  return createLogoutResponse();
}
