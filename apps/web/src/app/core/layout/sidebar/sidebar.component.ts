import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LanguageService } from '@core/services/language.service';

interface NavItem {
  path: string;
  label: string;
  badge?: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside
      class="h-full border-r border-slate-800 bg-slate-900/90 flex flex-col justify-between transition-all duration-300 ease-in-out select-none"
      [ngClass]="isCollapsed() ? 'w-20' : 'w-64'">
      <!-- Navigation Links -->
      <div class="p-3 space-y-1 overflow-y-auto">
        <div class="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono" [ngClass]="isCollapsed() ? 'text-center' : ''">
          <span *ngIf="!isCollapsed()">{{ languageService.t('sidebar.command_hub') }}</span>
          <span *ngIf="isCollapsed()">• • •</span>
        </div>

        <!-- 1. Control Tower -->
        <a
          routerLink="/control-tower"
          routerLinkActive="bg-blue-600 text-white font-medium shadow-md shadow-blue-900/30"
          [routerLinkActiveOptions]="{ exact: false }"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-slate-800/70 transition-all group"
          [attr.title]="isCollapsed() ? languageService.t('sidebar.control_tower') : null">
          <div class="flex items-center justify-center w-7 h-7 rounded-lg group-hover:scale-105 transition-transform shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" stroke-width="2"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3a9 9 0 0 1 9 9m-9-9a9 9 0 0 0-9 9m9-9v18m-9-9h18"/>
            </svg>
          </div>
          <span *ngIf="!isCollapsed()" class="truncate flex-1">{{ languageService.t('sidebar.control_tower') }}</span>
          <span *ngIf="!isCollapsed()" class="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-400 group-hover:text-slate-300">
            DAG
          </span>
        </a>

        <!-- 2. Freight Audit -->
        <a
          routerLink="/freight-audit"
          routerLinkActive="bg-blue-600 text-white font-medium shadow-md shadow-blue-900/30"
          [routerLinkActiveOptions]="{ exact: false }"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-slate-800/70 transition-all group"
          [attr.title]="isCollapsed() ? languageService.t('sidebar.freight_audit') : null">
          <div class="flex items-center justify-center w-7 h-7 rounded-lg group-hover:scale-105 transition-transform shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <span *ngIf="!isCollapsed()" class="truncate flex-1">{{ languageService.t('sidebar.freight_audit') }}</span>
          <span *ngIf="!isCollapsed()" class="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-400 group-hover:text-slate-300">
            5-Leg
          </span>
        </a>

        <!-- 3. Alert Center -->
        <a
          routerLink="/alert-center"
          routerLinkActive="bg-blue-600 text-white font-medium shadow-md shadow-blue-900/30"
          [routerLinkActiveOptions]="{ exact: false }"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-slate-800/70 transition-all group"
          [attr.title]="isCollapsed() ? languageService.t('sidebar.alert_center') : null">
          <div class="flex items-center justify-center w-7 h-7 rounded-lg group-hover:scale-105 transition-transform shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <span *ngIf="!isCollapsed()" class="truncate flex-1">{{ languageService.t('sidebar.alert_center') }}</span>
          <span *ngIf="!isCollapsed()" class="px-1.5 py-0.5 text-[10px] font-mono rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
            SLA
          </span>
        </a>

        <!-- 4. Shipments -->
        <a
          routerLink="/shipments"
          routerLinkActive="bg-blue-600 text-white font-medium shadow-md shadow-blue-900/30"
          [routerLinkActiveOptions]="{ exact: false }"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-slate-800/70 transition-all group"
          [attr.title]="isCollapsed() ? languageService.t('sidebar.shipments') : null">
          <div class="flex items-center justify-center w-7 h-7 rounded-lg group-hover:scale-105 transition-transform shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <span *ngIf="!isCollapsed()" class="truncate flex-1">{{ languageService.t('sidebar.shipments') }}</span>
          <span *ngIf="!isCollapsed()" class="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-400 group-hover:text-slate-300">
            3-Tier
          </span>
        </a>
      </div>

      <!-- Footer Collapse Button -->
      <div class="p-3 border-t border-slate-800">
        <button
          type="button"
          (click)="toggleCollapse()"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          [ngClass]="isCollapsed() ? 'justify-center' : 'justify-between'"
          [attr.title]="isCollapsed() ? languageService.t('sidebar.expand') : languageService.t('sidebar.collapse')"
          aria-label="Toggle sidebar collapse">
          <div class="flex items-center gap-2">
            <svg
              class="w-5 h-5 transition-transform duration-300"
              [ngClass]="isCollapsed() ? 'rotate-180' : ''"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
            <span *ngIf="!isCollapsed()">{{ isCollapsed() ? languageService.t('sidebar.expand') : languageService.t('sidebar.collapse') }}</span>
          </div>
          <span *ngIf="!isCollapsed()" class="text-[10px] font-mono text-slate-500">[ALT+S]</span>
        </button>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  readonly languageService = inject(LanguageService);
  readonly isCollapsed = signal<boolean>(false);

  toggleCollapse(): void {
    this.isCollapsed.update((collapsed) => !collapsed);
  }
}

