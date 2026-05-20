import { Request, Response, NextFunction } from 'express';
import { HttpClientError } from '../clients/BaseHttpClient';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
    return;
  }

  if (err instanceof HttpClientError) {
    res.status(502).json({
      success: false,
      error: {
        code: 'EXTERNAL_API_ERROR',
        message: `외부 API 호출에 실패했습니다 (${err.apiName})`,
      },
    });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: '서버 내부 오류가 발생했습니다.' },
  });
}
