export interface ApiResponse<T = any> {
  code: number; // 响应码，200表示成功，其他表示错误
  message: string;
  data: T;
}

export interface ApiError extends Error {
  response?: {
    data?: {
      message?: string;
      code?: number;
    };
    status?: number;
  };
  message: string;
}

export interface PageResponse<T> {
  total: number;
  list: T[];
} 