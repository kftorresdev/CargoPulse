import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { ApiResponse, AuthResponse, LoginPayload, UserProfile } from '../models/user.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;

  const mockUser: UserProfile = {
    id: 'user-1',
    email: 'admin@cargopulse.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
    isActive: true,
    createdAt: '2026-10-16T10:00:00Z'
  };

  const mockAuthResponse: ApiResponse<AuthResponse> = {
    success: true,
    data: {
      accessToken: 'jwt-access-token',
      user: mockUser
    },
    timestamp: '2026-10-16T10:00:00Z'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should send POST request to /api/auth/login', () => {
    const payload: LoginPayload = {
      email: 'admin@cargopulse.com',
      password: 'password123'
    };

    service.login(payload).subscribe((res) => {
      expect(res).toEqual(mockAuthResponse);
    });

    const req = httpTesting.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockAuthResponse);
  });

  it('should send GET request to /api/auth/profile', () => {
    const profileResponse: ApiResponse<UserProfile> = {
      success: true,
      data: mockUser,
      timestamp: '2026-10-16T10:00:00Z'
    };

    service.getProfile().subscribe((res) => {
      expect(res).toEqual(profileResponse);
    });

    const req = httpTesting.expectOne('/api/auth/profile');
    expect(req.request.method).toBe('GET');
    req.flush(profileResponse);
  });

  it('should send POST request to /api/auth/register', () => {
    const registerPayload = {
      email: 'newuser@cargopulse.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User'
    };

    service.register(registerPayload).subscribe((res) => {
      expect(res).toEqual(mockAuthResponse);
    });

    const req = httpTesting.expectOne('/api/auth/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(registerPayload);
    req.flush(mockAuthResponse);
  });
});
