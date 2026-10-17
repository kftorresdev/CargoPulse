import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-shipments',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </span>
            <h1 class="text-2xl font-bold text-slate-100 tracking-tight">{{ languageService.t('shipments.title') }}</h1>
          </div>
          <p class="mt-1 text-sm text-slate-400">
            {{ languageService.t('shipments.subtitle') }}
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            class="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-900/30">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            {{ languageService.t('shipments.new_booking') }}
          </button>
        </div>
      </div>

      <!-- Quick Metrics -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div class="text-xs text-slate-400">{{ languageService.t('shipments.kpi.total_active') }}</div>
          <div class="mt-2 text-2xl font-bold text-slate-100">1,849</div>
          <div class="mt-1 text-xs text-emerald-400">{{ languageService.t('shipments.kpi.green_channel') }}</div>
        </div>

        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div class="text-xs text-slate-400">{{ languageService.t('shipments.kpi.ocean_containers') }}</div>
          <div class="mt-2 text-2xl font-bold text-blue-400">1,230</div>
          <div class="mt-1 text-xs text-slate-500">{{ languageService.t('shipments.kpi.ocean_sub') }}</div>
        </div>

        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div class="text-xs text-slate-400">{{ languageService.t('shipments.kpi.air_express') }}</div>
          <div class="mt-2 text-2xl font-bold text-purple-400">412</div>
          <div class="mt-1 text-xs text-slate-500">{{ languageService.t('shipments.kpi.air_sub') }}</div>
        </div>

        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div class="text-xs text-slate-400">{{ languageService.t('shipments.kpi.rail_cars') }}</div>
          <div class="mt-2 text-2xl font-bold text-amber-400">207</div>
          <div class="mt-1 text-xs text-slate-500">{{ languageService.t('shipments.kpi.rail_sub') }}</div>
        </div>
      </div>

      <!-- 3-Level Notes Architecture Preview -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 class="text-base font-semibold text-slate-200">{{ languageService.t('shipments.notes.title') }}</h2>
            <p class="text-xs text-slate-400 mt-0.5">{{ languageService.t('shipments.notes.subtitle') }}</p>
          </div>
          <span class="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {{ languageService.t('shipments.notes.preview_badge') }}
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Level 1 -->
          <div class="bg-slate-950/70 border border-blue-500/30 rounded-xl p-4 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-mono font-bold text-blue-400">{{ languageService.t('shipments.notes.l1.badge') }}</span>
              <span class="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">{{ languageService.t('shipments.notes.l1.tier') }}</span>
            </div>
            <p class="text-xs text-slate-300 font-medium">{{ languageService.t('shipments.notes.l1.title') }}</p>
            <p class="text-xs text-slate-400">
              {{ languageService.t('shipments.notes.l1.desc') }}
            </p>
          </div>

          <!-- Level 2 -->
          <div class="bg-slate-950/70 border border-purple-500/30 rounded-xl p-4 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-mono font-bold text-purple-400">{{ languageService.t('shipments.notes.l2.badge') }}</span>
              <span class="text-[10px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded">{{ languageService.t('shipments.notes.l2.tier') }}</span>
            </div>
            <p class="text-xs text-slate-300 font-medium">{{ languageService.t('shipments.notes.l2.title') }}</p>
            <p class="text-xs text-slate-400">
              {{ languageService.t('shipments.notes.l2.desc') }}
            </p>
          </div>

          <!-- Level 3 -->
          <div class="bg-slate-950/70 border border-emerald-500/30 rounded-xl p-4 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-mono font-bold text-emerald-400">{{ languageService.t('shipments.notes.l3.badge') }}</span>
              <span class="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">{{ languageService.t('shipments.notes.l3.tier') }}</span>
            </div>
            <p class="text-xs text-slate-300 font-medium">{{ languageService.t('shipments.notes.l3.title') }}</p>
            <p class="text-xs text-slate-400">
              {{ languageService.t('shipments.notes.l3.desc') }}
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ShipmentsComponent {
  readonly languageService = inject(LanguageService);
}
