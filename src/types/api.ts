export interface ApiError {
  response?: {
    data?: {
      message?: string;
      code?: number;
    };
    status?: number;
  };
  message?: string;
} 