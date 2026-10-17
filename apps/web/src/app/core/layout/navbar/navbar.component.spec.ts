import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NavbarComponent } from './navbar.component';
import { AuthStore } from '@core/state/auth.store';
import { Role, UserProfile } from '@core/models/user.model';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let authStoreMock: {
    user: ReturnType<typeof signal<UserProfile | null>>;
    userName: ReturnType<typeof signal<string>>;
    userRole: ReturnType<typeof signal<Role | null>>;
    logout: ReturnType<typeof vi.fn>;
  };

  const mockAdminUser: UserProfile = {
    id: 'user-admin',
    email: 'admin@cargopulse.com',
    firstName: 'Alex',
    lastName: 'Vance',
    role: 'ADMIN',
    isActive: true,
    createdAt: '2026-01-01'
  };

  beforeEach(async () => {
    localStorage.clear();
    authStoreMock = {
      user: signal<UserProfile | null>(mockAdminUser),
      userName: signal<string>('Alex Vance'),
      userRole: signal<Role | null>('ADMIN'),
      logout: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        { provide: AuthStore, useValue: authStoreMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    component.setLanguage('es');
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render brand title and subtitle in default Spanish and toggle to English', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Cargo');
    expect(compiled.textContent).toContain('Pulse');
    expect(compiled.textContent).toContain('Torre de Control');

    component.setLanguage('en');
    fixture.detectChanges();
    expect(compiled.textContent).toContain('Control Tower');
  });

  it('should render Connected network status indicator in default Spanish and toggle to English', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Conectado');

    component.setLanguage('en');
    fixture.detectChanges();
    expect(compiled.textContent).toContain('Connected');
  });

  it('should render language toggle pill with ES and EN buttons', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const esBtn = compiled.querySelector('.lang-btn-es') as HTMLButtonElement;
    const enBtn = compiled.querySelector('.lang-btn-en') as HTMLButtonElement;

    expect(esBtn).toBeTruthy();
    expect(enBtn).toBeTruthy();

    expect(component.languageService.currentLang()).toBe('es');
    enBtn.click();
    fixture.detectChanges();
    expect(component.languageService.currentLang()).toBe('en');

    esBtn.click();
    fixture.detectChanges();
    expect(component.languageService.currentLang()).toBe('es');
  });

  it('should display the user full name and calculated initials', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Alex Vance');
    expect(component.userInitials()).toBe('AV');
  });

  it('should format role and apply correct badge style for ADMIN', () => {
    expect(component.formattedRole()).toBe('Admin');
    expect(component.roleBadgeClass()).toContain('purple');
  });

  it('should format role and apply correct badge style for LOGISTICS_OPERATOR', () => {
    authStoreMock.user.set({
      ...mockAdminUser,
      firstName: 'Sarah',
      lastName: 'Connor',
      role: 'LOGISTICS_OPERATOR'
    });
    authStoreMock.userRole.set('LOGISTICS_OPERATOR');
    authStoreMock.userName.set('Sarah Connor');
    fixture.detectChanges();

    expect(component.formattedRole()).toBe('Operador');
    component.setLanguage('en');
    expect(component.formattedRole()).toBe('Operator');
    expect(component.roleBadgeClass()).toContain('sky');
    expect(component.userInitials()).toBe('SC');
  });

  it('should format role and apply correct badge style for FREIGHT_AUDITOR', () => {
    authStoreMock.userRole.set('FREIGHT_AUDITOR');
    fixture.detectChanges();

    expect(component.formattedRole()).toBe('Auditor');
    expect(component.roleBadgeClass()).toContain('emerald');
  });

  it('should fall back gracefully when user is null', () => {
    authStoreMock.user.set(null);
    authStoreMock.userRole.set(null);
    authStoreMock.userName.set('');
    fixture.detectChanges();

    expect(component.userInitials()).toBe('CP');
    expect(component.formattedRole()).toBe('Invitado');
    component.setLanguage('en');
    expect(component.formattedRole()).toBe('Guest');
  });

  it('should call authStore.logout when clicking Sign Out button', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const signOutBtn = compiled.querySelector('.sign-out-btn') as HTMLButtonElement;
    expect(signOutBtn).toBeTruthy();

    signOutBtn.click();
    expect(authStoreMock.logout).toHaveBeenCalledTimes(1);
  });
});
