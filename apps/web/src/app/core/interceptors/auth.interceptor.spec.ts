import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { authInterceptor } from './auth.interceptor';
import { AuthStore } from '../state/auth.store';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;
  let authStoreMock: {
    token: ReturnType<typeof signal<string | null>>;
    logout: ReturnType<typeof vi.fn>;
  };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authStoreMock = {
      token: signal<string | null>(null),
      logout: vi.fn()
    };

    routerMock = {
      navigate: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthStore, useValue: authStoreMock },
        { provide: Router, useValue: routerMock }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should not add Authorization header if no token is present', () => {
    authStoreMock.token.set(null);

    httpClient.get('/api/test').subscribe();

    const req = httpTesting.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should add Authorization Bearer header if token is present', () => {
    authStoreMock.token.set('my-token-123');

    httpClient.get('/api/test').subscribe();

    const req = httpTesting.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-token-123');
    req.flush({});
  });

  it('should not override existing Authorization header', () => {
    authStoreMock.token.set('my-token-123');

    httpClient.get('/api/test', {
      headers: { Authorization: 'Basic dXNlcjpwYXNz' }
    }).subscribe();

    const req = httpTesting.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Basic dXNlcjpwYXNz');
    req.flush({});
  });

  it('should call authStore.logout() on 401 Unauthorized response', () => {
    authStoreMock.token.set('expired-token');

    let caughtError: unknown;
    httpClient.get('/api/protected').subscribe({
      next: () => {},
      error: (err) => {
        caughtError = err;
      }
    });

    const req = httpTesting.expectOne('/api/protected');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(authStoreMock.logout).toHaveBeenCalledTimes(1);
    expect(caughtError).toBeInstanceOf(HttpErrorResponse);
  });

  it('should not call authStore.logout() on 500 or 403 response', () => {
    authStoreMock.token.set('valid-token');

    httpClient.get('/api/forbidden').subscribe({
      next: () => {},
      error: () => {}
    });

    const req = httpTesting.expectOne('/api/forbidden');
    req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

    expect(authStoreMock.logout).not.toHaveBeenCalled();
  });
});
