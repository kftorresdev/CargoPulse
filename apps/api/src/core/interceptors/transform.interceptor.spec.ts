import { describe, it, expect, beforeEach } from 'vitest';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, firstValueFrom } from 'rxjs';
import { TransformInterceptor } from './transform.interceptor';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<any>;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
  });

  it('should wrap response data in standard ApiResponse envelope when headersSent is false', async () => {
    const mockContext = {
      switchToHttp: () => ({
        getResponse: () => ({ headersSent: false }),
      }),
    } as unknown as ExecutionContext;

    const payload = { id: 'SHP-1001', status: 'IN_TRANSIT' };
    const mockCallHandler: CallHandler = {
      handle: () => of(payload),
    };

    const result = await firstValueFrom(
      interceptor.intercept(mockContext, mockCallHandler),
    );

    expect(result.success).toBe(true);
    expect(result.data).toEqual(payload);
    expect(typeof result.timestamp).toBe('string');
  });

  it('should bypass envelope wrapping when res.headersSent is true (e.g. binary export)', async () => {
    const mockContext = {
      switchToHttp: () => ({
        getResponse: () => ({ headersSent: true }),
      }),
    } as unknown as ExecutionContext;

    const rawData = Buffer.from('excel-binary');
    const mockCallHandler: CallHandler = {
      handle: () => of(rawData),
    };

    const result = await firstValueFrom(
      interceptor.intercept(mockContext, mockCallHandler),
    );

    expect(result).toBe(rawData);
  });
});
