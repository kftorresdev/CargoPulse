import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LoginComponent } from './login.component';
import { AuthStore } from '@core/state/auth.store';
import { AuthResponse } from '@core/models/user.model';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let router: Router;
  let authStoreMock: {
    isLoading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    login: ReturnType<typeof vi.fn>;
  };

  const mockAuthResponse: AuthResponse = {
    accessToken: 'mock-jwt-token',
    user: {
      id: 'user-admin',
      email: 'admin@cargopulse.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isActive: true,
      createdAt: '2026-01-01'
    }
  };

  beforeEach(async () => {
    authStoreMock = {
      isLoading: signal<boolean>(false),
      error: signal<string | null>(null),
      login: vi.fn().mockReturnValue(of(mockAuthResponse))
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthStore, useValue: authStoreMock }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values and invalid state', () => {
    expect(component.loginForm.valid).toBe(false);
    expect(component.loginForm.value.email).toBe('');
    expect(component.loginForm.value.password).toBe('');
  });

  it('should validate email format', () => {
    const emailControl = component.loginForm.controls.email;

    emailControl.setValue('invalid-email');
    expect(emailControl.valid).toBe(false);
    expect(emailControl.errors?.['email']).toBeTruthy();

    emailControl.setValue('admin@cargopulse.com');
    expect(emailControl.valid).toBe(true);
  });

  it('should validate password length', () => {
    const passwordControl = component.loginForm.controls.password;

    passwordControl.setValue('12345');
    expect(passwordControl.valid).toBe(false);
    expect(passwordControl.errors?.['minlength']).toBeTruthy();

    passwordControl.setValue('123456');
    expect(passwordControl.valid).toBe(true);
  });

  it('should not call authStore.login when submitting an invalid form', () => {
    component.onSubmit();
    expect(authStoreMock.login).not.toHaveBeenCalled();
    expect(component.emailInvalid()).toBe(true);
    expect(component.passwordInvalid()).toBe(true);
  });

  it('should call authStore.login and navigate to /control-tower on valid submit', () => {
    component.loginForm.setValue({
      email: 'admin@cargopulse.com',
      password: 'Password123!'
    });

    component.onSubmit();

    expect(authStoreMock.login).toHaveBeenCalledWith({
      email: 'admin@cargopulse.com',
      password: 'Password123!'
    });
    expect(router.navigate).toHaveBeenCalledWith(['/control-tower']);
  });

  it('should handle login error gracefully without navigating', () => {
    authStoreMock.login.mockReturnValue(throwError(() => new Error('Invalid credentials')));

    component.loginForm.setValue({
      email: 'wrong@cargopulse.com',
      password: 'Password123!'
    });

    component.onSubmit();

    expect(authStoreMock.login).toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should fill form and submit when fillAndSubmit is invoked', () => {
    component.fillAndSubmit('auditor@cargopulse.com', 'Password123!');

    expect(component.loginForm.value.email).toBe('auditor@cargopulse.com');
    expect(component.loginForm.value.password).toBe('Password123!');
    expect(authStoreMock.login).toHaveBeenCalledWith({
      email: 'auditor@cargopulse.com',
      password: 'Password123!'
    });
    expect(router.navigate).toHaveBeenCalledWith(['/control-tower']);
  });

  it('should display error banner when authStore.error() is present', () => {
    authStoreMock.error.set('Invalid credentials provided.');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const errorAlert = compiled.querySelector('[role="alert"]');
    expect(errorAlert).toBeTruthy();
    expect(errorAlert?.textContent).toContain('Invalid credentials provided.');
  });

  it('should display loading state and disable submit button when authStore.isLoading() is true', () => {
    authStoreMock.isLoading.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const submitBtn = compiled.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
    expect(submitBtn.textContent).toContain('Authenticating...');

    const spinner = submitBtn.querySelector('svg.animate-spin');
    expect(spinner).toBeTruthy();
  });

  it('should trigger fillAndSubmit when clicking Quick Demo buttons', () => {
    const fillSpy = vi.spyOn(component, 'fillAndSubmit');
    const compiled = fixture.nativeElement as HTMLElement;

    // Find the 3 Quick Demo buttons in the footer
    const demoButtons = compiled.querySelectorAll('.grid.grid-cols-1 button');
    expect(demoButtons.length).toBe(3);

    // Click Admin demo button
    (demoButtons[0] as HTMLButtonElement).click();
    expect(fillSpy).toHaveBeenCalledWith('admin@cargopulse.com', 'Password123!');

    // Click Logistics Operator demo button
    (demoButtons[1] as HTMLButtonElement).click();
    expect(fillSpy).toHaveBeenCalledWith('operator@cargopulse.com', 'Password123!');

    // Click Freight Auditor demo button
    (demoButtons[2] as HTMLButtonElement).click();
    expect(fillSpy).toHaveBeenCalledWith('auditor@cargopulse.com', 'Password123!');
  });
});
