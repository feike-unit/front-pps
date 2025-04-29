export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface ApiError extends Error {
  response?: {
    data?: {
      message?: string;
    };
  };
} 