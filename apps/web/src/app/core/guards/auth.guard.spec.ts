import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { authGuard, publicGuard } from './auth.guard';
import { AuthStore } from '../state/auth.store';

describe('Auth Guards', () => {
  let router: Router;
  let authStoreMock: {
    isAuthenticated: ReturnType<typeof signal<boolean>>;
  };

  const dummyRoute = {} as ActivatedRouteSnapshot;
  const dummyState = {} as RouterStateSnapshot;

  beforeEach(() => {
    authStoreMock = {
      isAuthenticated: signal<boolean>(false)
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthStore, useValue: authStoreMock }
      ]
    });

    router = TestBed.inject(Router);
  });

  describe('authGuard', () => {
    it('should allow activation when user is authenticated', () => {
      authStoreMock.isAuthenticated.set(true);

      const result = TestBed.runInInjectionContext(() => authGuard(dummyRoute, dummyState));

      expect(result).toBe(true);
    });

    it('should redirect to /login when user is not authenticated', () => {
      authStoreMock.isAuthenticated.set(false);

      const result = TestBed.runInInjectionContext(() => authGuard(dummyRoute, dummyState));

      expect(result).toBeInstanceOf(UrlTree);
      expect((result as UrlTree).toString()).toBe('/login');
    });
  });

  describe('publicGuard', () => {
    it('should allow activation when user is not authenticated', () => {
      authStoreMock.isAuthenticated.set(false);

      const result = TestBed.runInInjectionContext(() => publicGuard(dummyRoute, dummyState));

      expect(result).toBe(true);
    });

    it('should redirect to /control-tower when user is authenticated', () => {
      authStoreMock.isAuthenticated.set(true);

      const result = TestBed.runInInjectionContext(() => publicGuard(dummyRoute, dummyState));

      expect(result).toBeInstanceOf(UrlTree);
      expect((result as UrlTree).toString()).toBe('/control-tower');
    });
  });
});
