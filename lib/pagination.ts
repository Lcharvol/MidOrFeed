import { z } from "zod";
import { NextRequest } from "next/server";

/**
 * Schéma de validation pour la pagination
 */
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => {
      const parsed = val ? parseInt(val, 10) : 20;
      // Limiter entre 1 et 100
      return Math.max(1, Math.min(100, parsed));
    }),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

/**
 * Extrait les paramètres de pagination depuis une requête
 */
export const getPaginationParams = (request: NextRequest): PaginationParams => {
  const searchParams = request.nextUrl.searchParams;
  return paginationSchema.parse({
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });
};

/**
 * Calcule le skip pour Prisma à partir des paramètres de pagination
 */
export const getSkip = (page: number, limit: number): number => {
  return (page - 1) * limit;
};

/**
 * Format de réponse paginée standard
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/**
 * Crée une réponse paginée standardisée
 */
export const createPaginatedResponse = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> => {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  };
};

