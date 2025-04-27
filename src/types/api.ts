export interface ApiResponse<T = any> {
  code: number; // 响应码，200表示成功，其他表示错误
  message: string;
  data: T;
  timestamp: string;
}

export interface ApiError {
  response?: {
    data?: {
      code: number;
      message: string;
    };
  };
  message?: string;
}

export interface PageResponse<T> {
  pageNum: number;
  pageSize: number;
  total: number;
  pages: number;
  list: T[];
} 