export type ApiMeta = {
  total: number;
  page: number;
  pageSize: number;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: ApiMeta;
};

export type ApiError = {
  success: false;
  error: string;
  details?: unknown;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'MR';
  territory: string | null;
};
