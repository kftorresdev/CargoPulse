import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AuthResponse, LoginPayload, UserProfile } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthStore {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  private readonly tokenKey = 'cargopulse_token';
  private readonly userKey = 'cargopulse_user';

  readonly user = signal<UserProfile | null>(null);
  readonly token = signal<string | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly isAuthenticated = computed(() => !!this.token());
  readonly userRole = computed(() => this.user()?.role ?? null);
  readonly userName = computed(() => (this.user() ? `${this.user()!.firstName} ${this.user()!.lastName}` : ''));
  readonly isAdmin = computed(() => this.user()?.role === 'ADMIN');

  constructor() {
    this.hydrate();
  }

  login(credentials: LoginPayload): Observable<AuthResponse> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.authService.login(credentials).pipe(
      map((response) => {
        const authData: AuthResponse = (response as any)?.data ?? response;
        this.token.set(authData.accessToken);
        this.user.set(authData.user);
        this.isLoading.set(false);
        this.error.set(null);

        this.saveToStorage(authData.accessToken, authData.user);
        return authData;
      }),
      catchError((err: HttpErrorResponse | Error | any) => {
        this.isLoading.set(false);
        const errorMessage =
          err?.error?.message ||
          err?.message ||
          'Authentication failed';
        this.error.set(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
        return throwError(() => err);
      })
    );
  }

  logout(): void {
    this.token.set(null);
    this.user.set(null);
    this.error.set(null);
    this.isLoading.set(false);

    this.clearStorage();
    this.router.navigate(['/login']);
  }

  setUser(user: UserProfile): void {
    this.user.set(user);
    if (!this.isStorageAvailable()) {
      return;
    }

    try {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    } catch (error) {
      console.error('Error updating user in localStorage:', error);
    }
  }

  private isStorageAvailable(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  private hydrate(): void {
    if (!this.isStorageAvailable()) {
      return;
    }

    try {
      const savedToken = localStorage.getItem(this.tokenKey);
      const savedUserStr = localStorage.getItem(this.userKey);

      if (savedToken) {
        this.token.set(savedToken);
      }
      if (savedUserStr) {
        const parsedUser = JSON.parse(savedUserStr) as UserProfile;
        this.user.set(parsedUser);
      }
    } catch (error) {
      console.error('Error hydrating auth state from localStorage:', error);
    }
  }

  private saveToStorage(token: string, user: UserProfile): void {
    if (!this.isStorageAvailable()) {
      return;
    }

    try {
      localStorage.setItem(this.tokenKey, token);
      localStorage.setItem(this.userKey, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving auth state to localStorage:', error);
    }
  }

  private clearStorage(): void {
    if (!this.isStorageAvailable()) {
      return;
    }

    try {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
    } catch (error) {
      console.error('Error clearing auth state from localStorage:', error);
    }
  }
}
