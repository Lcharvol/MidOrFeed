export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}


