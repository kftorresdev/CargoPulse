import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthStore } from './auth.store';
import { AuthService } from '../services/auth.service';
import { ApiResponse, AuthResponse, LoginPayload, UserProfile } from '../models/user.model';

describe('AuthStore', () => {
  let store: AuthStore;
  let authServiceMock: { login: ReturnType<typeof vi.fn> };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  const mockUser: UserProfile = {
    id: 'user-123',
    email: 'admin@cargopulse.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'ADMIN',
    isActive: true,
    createdAt: '2026-10-16T12:00:00.000Z'
  };

  const mockOperatorUser: UserProfile = {
    id: 'user-456',
    email: 'operator@cargopulse.com',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'LOGISTICS_OPERATOR',
    isActive: true,
    createdAt: '2026-10-16T12:00:00.000Z'
  };

  const mockAuthResponse: AuthResponse = {
    accessToken: 'test-jwt-token-xyz',
    user: mockUser
  };

  const mockApiResponse: ApiResponse<AuthResponse> = {
    success: true,
    data: mockAuthResponse,
    timestamp: '2026-10-16T12:00:00.000Z'
  };

  beforeEach(() => {
    localStorage.clear();

    authServiceMock = {
      login: vi.fn()
    };

    routerMock = {
      navigate: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        AuthStore,
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });

    store = TestBed.inject(AuthStore);
  });

  describe('Initial State', () => {
    it('should initialize with default null/false values when storage is empty', () => {
      expect(store.user()).toBeNull();
      expect(store.token()).toBeNull();
      expect(store.isLoading()).toBe(false);
      expect(store.error()).toBeNull();
      expect(store.isAuthenticated()).toBe(false);
      expect(store.userRole()).toBeNull();
      expect(store.userName()).toBe('');
      expect(store.isAdmin()).toBe(false);
    });

    it('should hydrate saved credentials from localStorage on creation', () => {
      localStorage.setItem('cargopulse_token', 'persisted-token-123');
      localStorage.setItem('cargopulse_user', JSON.stringify(mockUser));

      // Re-instantiate store to test hydration
      const hydratedStore = TestBed.runInInjectionContext(() => new AuthStore());

      expect(hydratedStore.token()).toBe('persisted-token-123');
      expect(hydratedStore.user()).toEqual(mockUser);
      expect(hydratedStore.isAuthenticated()).toBe(true);
      expect(hydratedStore.isAdmin()).toBe(true);
      expect(hydratedStore.userName()).toBe('John Doe');
      expect(hydratedStore.userRole()).toBe('ADMIN');
    });

    it('should handle corrupted json in localStorage safely during hydration', () => {
      localStorage.setItem('cargopulse_token', 'persisted-token-123');
      localStorage.setItem('cargopulse_user', 'invalid-json{{{');

      expect(() => {
        TestBed.runInInjectionContext(() => new AuthStore());
      }).not.toThrow();
    });
  });

  describe('Computed Signals', () => {
    it('should compute isAuthenticated based on presence of token', () => {
      expect(store.isAuthenticated()).toBe(false);

      store.token.set('valid-token');
      expect(store.isAuthenticated()).toBe(true);

      store.token.set(null);
      expect(store.isAuthenticated()).toBe(false);
    });

    it('should compute userRole correctly', () => {
      expect(store.userRole()).toBeNull();

      store.user.set(mockUser);
      expect(store.userRole()).toBe('ADMIN');

      store.user.set(mockOperatorUser);
      expect(store.userRole()).toBe('LOGISTICS_OPERATOR');
    });

    it('should compute userName correctly', () => {
      expect(store.userName()).toBe('');

      store.user.set(mockUser);
      expect(store.userName()).toBe('John Doe');
    });

    it('should compute isAdmin correctly', () => {
      expect(store.isAdmin()).toBe(false);

      store.user.set(mockUser);
      expect(store.isAdmin()).toBe(true);

      store.user.set(mockOperatorUser);
      expect(store.isAdmin()).toBe(false);
    });
  });

  describe('login()', () => {
    const credentials: LoginPayload = {
      email: 'admin@cargopulse.com',
      password: 'password123'
    };

    it('should handle login success, update signals, and persist to localStorage', () => {
      authServiceMock.login.mockReturnValue(of(mockApiResponse));

      let result: AuthResponse | undefined;
      store.login(credentials).subscribe({
        next: (res) => {
          result = res;
        }
      });

      expect(authServiceMock.login).toHaveBeenCalledWith(credentials);
      expect(result).toEqual(mockAuthResponse);
      expect(store.token()).toBe('test-jwt-token-xyz');
      expect(store.user()).toEqual(mockUser);
      expect(store.isLoading()).toBe(false);
      expect(store.error()).toBeNull();
      expect(store.isAuthenticated()).toBe(true);

      expect(localStorage.getItem('cargopulse_token')).toBe('test-jwt-token-xyz');
      expect(localStorage.getItem('cargopulse_user')).toBe(JSON.stringify(mockUser));
    });

    it('should handle login failure, set error signal, and leave tokens empty', () => {
      const errorResponse = {
        error: { message: 'Invalid credentials' }
      };
      authServiceMock.login.mockReturnValue(throwError(() => errorResponse));

      let caughtError: any;
      store.login(credentials).subscribe({
        next: () => {},
        error: (err) => {
          caughtError = err;
        }
      });

      expect(caughtError).toEqual(errorResponse);
      expect(store.isLoading()).toBe(false);
      expect(store.error()).toBe('Invalid credentials');
      expect(store.token()).toBeNull();
      expect(store.user()).toBeNull();
      expect(store.isAuthenticated()).toBe(false);
      expect(localStorage.getItem('cargopulse_token')).toBeNull();
    });
  });

  describe('logout()', () => {
    it('should clear signals, remove items from localStorage, and navigate to /login', () => {
      store.token.set('some-token');
      store.user.set(mockUser);
      store.error.set('some-previous-error');
      localStorage.setItem('cargopulse_token', 'some-token');
      localStorage.setItem('cargopulse_user', JSON.stringify(mockUser));

      store.logout();

      expect(store.token()).toBeNull();
      expect(store.user()).toBeNull();
      expect(store.error()).toBeNull();
      expect(store.isLoading()).toBe(false);
      expect(store.isAuthenticated()).toBe(false);

      expect(localStorage.getItem('cargopulse_token')).toBeNull();
      expect(localStorage.getItem('cargopulse_user')).toBeNull();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('setUser()', () => {
    it('should update user signal and sync to localStorage', () => {
      store.setUser(mockOperatorUser);

      expect(store.user()).toEqual(mockOperatorUser);
      expect(localStorage.getItem('cargopulse_user')).toBe(JSON.stringify(mockOperatorUser));
    });
  });
});
