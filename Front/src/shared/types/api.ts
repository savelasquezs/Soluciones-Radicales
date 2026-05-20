export type ApiResponse<T> = {
  data: T;
};

export type ApiError = {
  message: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
};
