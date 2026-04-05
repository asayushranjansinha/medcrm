import { NextResponse } from 'next/server';
import type { ApiError, ApiMeta, ApiSuccess } from '@/types';

export function jsonSuccess<T>(data: T, meta?: ApiMeta, init?: ResponseInit) {
  const body: ApiSuccess<T> = meta !== undefined ? { success: true, data, meta } : { success: true, data };
  return NextResponse.json(body, init);
}

export function jsonError(message: string, status = 400, details?: unknown) {
  const body: ApiError = details !== undefined ? { success: false, error: message, details } : { success: false, error: message };
  return NextResponse.json(body, { status });
}
