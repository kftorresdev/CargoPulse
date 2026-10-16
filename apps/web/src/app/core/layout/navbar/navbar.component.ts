import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthStore } from '@core/state/auth.store';
import { Role } from '@core/models/user.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="h-16 border-b border-slate-800 bg-slate-900/95 backdrop-blur px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      <!-- Left: Brand Logo & Title -->
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/20">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div class="flex items-center gap-2.5">
          <span class="text-lg font-black tracking-tight text-white font-sans">Cargo<span class="text-blue-500">Pulse</span></span>
          <span class="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
            Control Tower
          </span>
        </div>
      </div>

      <!-- Right: Network Status, User Profile & Actions -->
      <div class="flex items-center gap-3 sm:gap-6">
        <!-- Network Status Indicator -->
        <div class="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-sm" title="Telemetry stream status: Connected">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span class="text-xs font-medium text-emerald-400 hidden xs:inline tracking-wide">Connected</span>
        </div>

        <div class="h-6 w-px bg-slate-800 hidden sm:block"></div>

        <!-- User Profile Section -->
        <div class="flex items-center gap-3">
          <!-- Avatar -->
          <div class="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-200 uppercase tracking-wider shadow-inner">
            {{ userInitials() }}
          </div>

          <!-- User Details (Hidden on tiny screens) -->
          <div class="hidden md:flex flex-col text-left">
            <span class="text-xs font-semibold text-slate-200 leading-tight">
              {{ authStore.userName() || 'CargoPulse User' }}
            </span>
            <div class="mt-0.5">
              <span
                class="inline-block text-[10px] font-medium px-1.5 py-0.2 rounded border uppercase tracking-wider"
                [ngClass]="roleBadgeClass()">
                {{ formattedRole() }}
              </span>
            </div>
          </div>
        </div>

        <!-- Mobile-only role pill -->
        <span
          class="md:hidden inline-block text-[10px] font-medium px-1.5 py-0.5 rounded border uppercase tracking-wider"
          [ngClass]="roleBadgeClass()">
          {{ formattedRole() }}
        </span>

        <!-- Sign Out Button -->
        <button
          (click)="onLogout()"
          type="button"
          class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 border border-slate-700 transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-slate-600"
          title="Sign Out">
          <svg class="w-4 h-4 text-slate-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span class="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  `
})
export class NavbarComponent {
  readonly authStore = inject(AuthStore);

  readonly userInitials = computed(() => {
    const user = this.authStore.user();
    if (!user) return 'CP';
    const first = user.firstName ? user.firstName.charAt(0) : '';
    const last = user.lastName ? user.lastName.charAt(0) : '';
    return (first + last).toUpperCase() || 'CP';
  });

  readonly roleBadgeClass = computed(() => {
    const role: Role | null = this.authStore.userRole();
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'LOGISTICS_OPERATOR':
        return 'bg-sky-500/10 text-sky-300 border-sky-500/30';
      case 'FREIGHT_AUDITOR':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600';
    }
  });

  readonly formattedRole = computed(() => {
    const role: Role | null = this.authStore.userRole();
    switch (role) {
      case 'ADMIN':
        return 'Admin';
      case 'LOGISTICS_OPERATOR':
        return 'Operator';
      case 'FREIGHT_AUDITOR':
        return 'Auditor';
      default:
        return 'Guest';
    }
  });

  onLogout(): void {
    this.authStore.logout();
  }
}
