import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthStore } from '@core/state/auth.store';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen w-full flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden select-none">
      <!-- Ambient Background Accents -->
      <div class="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <!-- Login Card -->
      <div class="w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative z-10 backdrop-blur-xl">
        <!-- Brand Header -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 shadow-xl shadow-blue-500/25 border border-blue-400/20 mb-4">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 class="text-2xl font-black tracking-tight text-white font-sans">
            Cargo<span class="text-blue-500">Pulse</span>
          </h1>
          <p class="text-xs text-slate-400 mt-1">
            Logistics Control Tower & Supply Chain Intelligence
          </p>
        </div>

        <!-- Reactive Error Banner -->
        <div
          *ngIf="authStore.error()"
          class="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3 animate-fade-in"
          role="alert">
          <svg class="w-5 h-5 text-rose-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div class="flex-1 font-medium leading-relaxed">
            {{ authStore.error() }}
          </div>
        </div>

        <!-- Login Form -->
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-4">
          <!-- Email Field -->
          <div>
            <label for="email" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Work Email
            </label>
            <div class="relative">
              <input
                id="email"
                type="email"
                formControlName="email"
                autocomplete="email"
                placeholder="name@cargopulse.com"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border text-sm text-slate-100 placeholder-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                [ngClass]="emailInvalid() ? 'border-rose-500/60 focus:ring-rose-500' : 'border-slate-800 focus:border-blue-500'" />
            </div>
            <div *ngIf="emailInvalid()" class="mt-1 text-[11px] text-rose-400">
              <span *ngIf="loginForm.controls.email.errors?.['required']">Email address is required.</span>
              <span *ngIf="loginForm.controls.email.errors?.['email']">Please enter a valid email address.</span>
            </div>
          </div>

          <!-- Password Field -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label for="password" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <span class="text-[11px] text-slate-500 font-mono">Min. 6 chars</span>
            </div>
            <div class="relative">
              <input
                id="password"
                type="password"
                formControlName="password"
                autocomplete="current-password"
                placeholder="••••••••"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border text-sm text-slate-100 placeholder-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                [ngClass]="passwordInvalid() ? 'border-rose-500/60 focus:ring-rose-500' : 'border-slate-800 focus:border-blue-500'" />
            </div>
            <div *ngIf="passwordInvalid()" class="mt-1 text-[11px] text-rose-400">
              <span *ngIf="loginForm.controls.password.errors?.['required']">Password is required.</span>
              <span *ngIf="loginForm.controls.password.errors?.['minlength']">Password must be at least 6 characters.</span>
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="authStore.isLoading()"
            class="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
            <svg
              *ngIf="authStore.isLoading()"
              class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ authStore.isLoading() ? 'Authenticating...' : 'Sign In to Control Tower' }}</span>
          </button>
        </form>

        <!-- Quick 1-Click Demo Access Section -->
        <div class="mt-8 pt-6 border-t border-slate-800">
          <div class="text-center mb-3">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Quick Demo Access
            </span>
            <p class="text-[11px] text-slate-500 mt-0.5">Instant 1-click login with pre-seeded role credentials</p>
          </div>

          <div class="grid grid-cols-1 gap-2">
            <!-- 1. Admin -->
            <button
              type="button"
              (click)="fillAndSubmit('admin@cargopulse.com', 'Password123!')"
              [disabled]="authStore.isLoading()"
              class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-200 text-xs font-medium transition-colors disabled:opacity-50 text-left">
              <div class="flex items-center gap-2.5">
                <span class="w-2 h-2 rounded-full bg-purple-400"></span>
                <span class="font-semibold">Administrator</span>
              </div>
              <span class="text-[10px] font-mono text-purple-300">admin&#64;cargopulse.com</span>
            </button>

            <!-- 2. Logistics Operator -->
            <button
              type="button"
              (click)="fillAndSubmit('operator@cargopulse.com', 'Password123!')"
              [disabled]="authStore.isLoading()"
              class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-200 text-xs font-medium transition-colors disabled:opacity-50 text-left">
              <div class="flex items-center gap-2.5">
                <span class="w-2 h-2 rounded-full bg-sky-400"></span>
                <span class="font-semibold">Logistics Operator</span>
              </div>
              <span class="text-[10px] font-mono text-sky-300">operator&#64;cargopulse.com</span>
            </button>

            <!-- 3. Freight Auditor -->
            <button
              type="button"
              (click)="fillAndSubmit('auditor@cargopulse.com', 'Password123!')"
              [disabled]="authStore.isLoading()"
              class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-xs font-medium transition-colors disabled:opacity-50 text-left">
              <div class="flex items-center gap-2.5">
                <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span class="font-semibold">Freight Auditor</span>
              </div>
              <span class="text-[10px] font-mono text-emerald-300">auditor&#64;cargopulse.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly authStore = inject(AuthStore);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  constructor() {
    effect(() => {
      if (this.authStore.isLoading()) {
        this.loginForm.disable({ emitEvent: false });
      } else {
        this.loginForm.enable({ emitEvent: false });
      }
    });
  }

  emailInvalid(): boolean {
    const control = this.loginForm.controls.email;
    return control.invalid && (control.dirty || control.touched);
  }

  passwordInvalid(): boolean {
    const control = this.loginForm.controls.password;
    return control.invalid && (control.dirty || control.touched);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.getRawValue();
    this.authStore.login({ email, password }).subscribe({
      next: () => {
        this.router.navigate(['/control-tower']);
      },
      error: () => {
        // Handled reactively via authStore.error signal
      }
    });
  }

  fillAndSubmit(email: string, password: string): void {
    this.loginForm.setValue({ email, password });
    this.onSubmit();
  }
}
