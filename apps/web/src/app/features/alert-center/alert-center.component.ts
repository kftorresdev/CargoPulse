import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '@core/services/language.service';
import { AlertCenterService } from './services/alert-center.service';
import {
  AlertFilterType,
  AlertKpis,
  AlertSeverity,
  OperationalAlert,
} from './models/alert.model';

@Component({
  selector: 'app-alert-center',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div
        class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5"
      >
        <div>
          <div class="flex items-center gap-2">
            <span
              class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </span>
            <h1 class="text-2xl font-bold text-slate-100 tracking-tight">
              {{ languageService.t('alert_center.title') }}
            </h1>
          </div>
          <p class="mt-1 text-sm text-slate-400">
            {{ languageService.t('alert_center.subtitle') }}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <span
            class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
            {{ kpis()?.criticalCount ?? 0 }}
            {{ languageService.t('alert_center.filter.critical') }}
          </span>
        </div>
      </div>

      <!-- KPI Strip -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 1. Critical Incidents (P1) -->
        <div
          class="bg-slate-900/80 border border-rose-500/30 rounded-xl p-4 shadow-lg shadow-rose-950/20 flex flex-col justify-between"
        >
          <div class="flex items-center justify-between text-xs text-rose-400 font-medium">
            <span>{{ languageService.t('alert_center.kpi.critical_breaches') }}</span>
            <span class="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold text-[11px]">
              {{ languageService.t('alert_center.kpi.action_req') }}
            </span>
          </div>
          <div class="mt-2 text-2xl font-bold text-rose-400">
            {{ kpis()?.criticalCount ?? 0 }}
          </div>
          <div class="mt-1 text-xs text-slate-400">
            {{ languageService.t('alert_center.kpi.critical_sub') }}
          </div>
        </div>

        <!-- 2. Elevated / At-Risk (P2/HIGH) -->
        <div
          class="bg-slate-900/80 border border-amber-500/30 rounded-xl p-4 shadow-lg shadow-amber-950/20 flex flex-col justify-between"
        >
          <div class="flex items-center justify-between text-xs text-amber-400 font-medium">
            <span>{{ languageService.t('alert_center.kpi.at_risk') }}</span>
            <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          </div>
          <div class="mt-2 text-2xl font-bold text-amber-400">
            {{ kpis()?.highCount ?? 0 }}
          </div>
          <div class="mt-1 text-xs text-slate-400">
            {{ languageService.t('alert_center.kpi.at_risk_sub') }}
          </div>
        </div>

        <!-- 3. Total Financial Impact (USD) -->
        <div
          class="bg-slate-900/80 border border-emerald-500/30 rounded-xl p-4 shadow-lg shadow-emerald-950/20 flex flex-col justify-between"
        >
          <div class="flex items-center justify-between text-xs text-emerald-400 font-medium">
            <span>{{ languageService.t('alert_center.financial_impact') }}</span>
            <span class="text-[11px] font-mono text-emerald-500">USD</span>
          </div>
          <div class="mt-2 text-2xl font-bold text-emerald-400 font-mono">
            {{ formatCurrency(kpis()?.totalFinancialImpactUsd ?? 0) }}
          </div>
          <div class="mt-1 text-xs text-slate-400">
            {{ languageService.t('alert_center.kpi.mttr_sub') }}
          </div>
        </div>

        <!-- 4. Resolved Incidents -->
        <div
          class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between"
        >
          <div class="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>{{ languageService.t('alert_center.kpi.resolved_today') }}</span>
            <span class="text-xs text-emerald-400 font-bold">✓</span>
          </div>
          <div class="mt-2 text-2xl font-bold text-slate-100">
            {{ kpis()?.resolvedCount ?? 0 }}
          </div>
          <div class="mt-1 text-xs text-emerald-400">
            {{ languageService.t('alert_center.kpi.resolved_sub') }}
          </div>
        </div>
      </div>

      <!-- Filter Bar -->
      <div
        class="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-xl"
      >
        @for (filter of filterOptions; track filter) {
          <button
            type="button"
            (click)="setFilter(filter)"
            [class]="
              selectedFilter() === filter
                ? 'px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 text-white shadow-md shadow-rose-950/40 border border-rose-500/50 transition-all cursor-pointer'
                : 'px-3.5 py-1.5 text-xs font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent transition-all cursor-pointer'
            "
          >
            {{ getFilterLabel(filter) }}
            <span
              class="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px]"
              [class]="
                selectedFilter() === filter
                  ? 'bg-rose-950/80 text-rose-200'
                  : 'bg-slate-800 text-slate-400'
              "
            >
              {{ getFilterCount(filter) }}
            </span>
          </button>
        }
      </div>

      <!-- Active Incident Stream Card -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div
          class="flex items-center justify-between mb-5 border-b border-slate-800 pb-3"
        >
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            <h2 class="text-base font-semibold text-slate-200">
              {{ languageService.t('alert_center.stream.title') }}
            </h2>
          </div>
          <div class="text-xs text-slate-400 font-mono">
            {{ languageService.t('alert_center.stream.engine_status') }}
          </div>
        </div>

        <!-- Incidents List -->
        <div class="space-y-3">
          @if (filteredAlerts().length === 0) {
            <div
              class="text-center py-12 px-4 rounded-xl border border-dashed border-slate-800 text-slate-400"
            >
              <svg
                class="w-12 h-12 mx-auto text-slate-600 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p class="text-sm font-medium text-slate-300">
                {{ languageService.t('freight_audit.kpi.all_clear') }}
              </p>
              <p class="text-xs text-slate-500 mt-1">
                {{ languageService.t('control_tower.table.no_shipments') }}
              </p>
            </div>
          }

          @for (alert of filteredAlerts(); track alert.id) {
            <div
              class="rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border transition-all"
              [class]="
                alert.status === 'RESOLVED'
                  ? 'bg-slate-950/40 border-slate-800/80 opacity-80 hover:opacity-100'
                  : alert.severity === 'CRITICAL'
                    ? 'bg-slate-950/80 border-rose-500/40 shadow-sm shadow-rose-950/20'
                    : alert.severity === 'HIGH'
                      ? 'bg-slate-950/80 border-amber-500/40 shadow-sm shadow-amber-950/20'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
              "
            >
              <!-- Alert Details -->
              <div class="space-y-2 max-w-3xl">
                <div class="flex flex-wrap items-center gap-2">
                  <!-- Priority Badge -->
                  <span
                    class="px-2 py-0.5 rounded text-[10px] font-bold border"
                    [class]="getSeverityBadgeClass(alert.severity)"
                  >
                    {{ getSeverityLabel(alert.severity) }}
                  </span>

                  <!-- Tracking Number -->
                  <span
                    class="font-mono text-xs font-semibold text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800"
                  >
                    {{ alert.shipmentTracking }}
                  </span>

                  <!-- Carrier -->
                  <span class="text-xs text-slate-400 flex items-center gap-1">
                    <span class="text-slate-600">•</span>
                    {{ alert.carrier }}
                  </span>

                  <!-- Financial Impact Badge -->
                  @if (alert.financialImpactUsd > 0) {
                    <span
                      class="inline-flex items-center gap-1 font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20"
                    >
                      {{ formatCurrency(alert.financialImpactUsd) }}
                    </span>
                  }
                </div>

                <!-- Title & Description -->
                <div>
                  <h3 class="text-sm sm:text-base font-semibold text-slate-100">
                    {{ alert.title }}
                  </h3>
                  <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
                    {{ alert.description }}
                  </p>
                </div>

                <!-- Resolution Note / Resolved Callout -->
                @if (alert.status === 'RESOLVED' && alert.resolutionNotes) {
                  <div
                    class="bg-emerald-950/20 border border-emerald-500/30 rounded-lg p-2.5 text-xs text-emerald-300 flex items-start gap-2"
                  >
                    <svg
                      class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <div>
                      <span class="font-semibold text-emerald-200">
                        {{ languageService.t('alert_center.resolved_badge') }}:
                      </span>
                      {{ alert.resolutionNotes }}
                      @if (alert.resolvedAt) {
                        <span class="text-emerald-400/70 ml-1 text-[11px]">
                          ({{ alert.resolvedAt | date: 'medium' }})
                        </span>
                      }
                    </div>
                  </div>
                }
              </div>

              <!-- SLA Countdown & Action Button -->
              <div
                class="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800"
              >
                @if (alert.status !== 'RESOLVED') {
                  <!-- Live SLA Countdown Box -->
                  <div class="text-left md:text-right">
                    <div
                      class="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1"
                    >
                      {{ languageService.t('alert_center.sla_remaining') }}
                    </div>
                    @let countdown = getCountdown(alert.slaDeadline);
                    <div
                      class="text-sm sm:text-base font-mono font-bold px-3 py-1 rounded border inline-block"
                      [class]="
                        countdown.isBreached
                          ? 'text-rose-400 bg-rose-950/80 border-rose-500 animate-pulse'
                          : alert.severity === 'CRITICAL'
                            ? 'text-rose-400 bg-rose-950/60 border-rose-800/40'
                            : 'text-amber-400 bg-amber-950/60 border-amber-800/40'
                      "
                    >
                      {{ countdown.text }}
                    </div>
                  </div>

                  <!-- Resolve Action Button -->
                  <button
                    type="button"
                    (click)="openResolveModal(alert)"
                    class="px-3.5 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/30 border border-rose-500/40 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <svg
                      class="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {{ languageService.t('alert_center.resolve_action') }}
                  </button>
                } @else {
                  <!-- Resolved Badge -->
                  <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {{ languageService.t('alert_center.resolved_badge') }}
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </div>

    <!-- Resolution Modal -->
    @if (resolvingAlert(); as alert) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto"
        (click)="closeResolveModal()"
      >
        <div
          class="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-100"
          (click)="$event.stopPropagation()"
        >
          <!-- Modal Header -->
          <div class="flex items-start justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 class="text-lg font-bold text-slate-100">
                {{ languageService.t('alert_center.resolve_modal.title') }}
              </h3>
              <p class="text-xs text-slate-400 mt-0.5">
                {{ languageService.t('alert_center.resolve_modal.subtitle') }}
              </p>
            </div>
            <button
              type="button"
              (click)="closeResolveModal()"
              [disabled]="isResolving()"
              class="text-slate-400 hover:text-slate-200 text-lg font-bold p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
            >
              ✕
            </button>
          </div>

          <!-- Incident Summary Card -->
          <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div class="flex items-center justify-between">
              <span
                class="px-2 py-0.5 rounded text-[10px] font-bold border"
                [class]="getSeverityBadgeClass(alert.severity)"
              >
                {{ getSeverityLabel(alert.severity) }}
              </span>
              <span class="font-mono text-xs font-semibold text-slate-300">
                {{ alert.shipmentTracking }}
              </span>
            </div>
            <p class="text-sm font-semibold text-slate-200">
              {{ alert.title }}
            </p>
            <div class="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-900">
              <span>{{ languageService.t('alert_center.carrier') }}: {{ alert.carrier }}</span>
              @if (alert.financialImpactUsd > 0) {
                <span class="text-rose-400 font-mono font-medium">
                  {{ formatCurrency(alert.financialImpactUsd) }}
                </span>
              }
            </div>
          </div>

          <!-- Notes Textarea -->
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-slate-300">
              {{ languageService.t('alert_center.resolve_modal.notes_label') }}
              <span class="text-rose-400">*</span>
            </label>
            <textarea
              rows="3"
              [value]="resolutionNotes()"
              (input)="resolutionNotes.set($any($event.target).value)"
              [placeholder]="languageService.t('alert_center.resolve_modal.notes_placeholder')"
              class="w-full px-3 py-2 text-xs text-slate-200 bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 resize-none"
            ></textarea>
          </div>

          <!-- Modal Actions -->
          <div class="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              (click)="closeResolveModal()"
              [disabled]="isResolving()"
              class="px-4 py-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
            >
              {{ languageService.t('alert_center.resolve_modal.btn_cancel') }}
            </button>
            <button
              type="button"
              (click)="confirmResolution()"
              [disabled]="!resolutionNotes().trim() || isResolving()"
              class="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-rose-950/40 transition-all flex items-center gap-2 cursor-pointer"
            >
              @if (isResolving()) {
                <svg
                  class="animate-spin h-3.5 w-3.5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  ></path>
                </svg>
                {{ languageService.t('alert_center.resolve_modal.resolving') }}
              } @else {
                {{ languageService.t('alert_center.resolve_modal.btn_confirm') }}
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AlertCenterComponent implements OnInit, OnDestroy {
  readonly languageService = inject(LanguageService);
  readonly alertCenterService = inject(AlertCenterService);

  readonly kpis = signal<AlertKpis | null>(null);
  readonly alerts = signal<OperationalAlert[]>([]);
  readonly selectedFilter = signal<AlertFilterType>('ALL');
  readonly resolvingAlert = signal<OperationalAlert | null>(null);
  readonly isResolving = signal<boolean>(false);
  readonly resolutionNotes = signal<string>('');
  readonly nowTick = signal<number>(Date.now());

  readonly filterOptions: AlertFilterType[] = [
    'ALL',
    'CRITICAL',
    'HIGH',
    'MEDIUM',
    'LOW',
    'OPEN',
    'RESOLVED',
  ];

  private timerId?: ReturnType<typeof setInterval>;

  readonly filteredAlerts = computed(() => {
    const filter = this.selectedFilter();
    const list = this.alerts();

    switch (filter) {
      case 'ALL':
        return list;
      case 'CRITICAL':
      case 'HIGH':
      case 'MEDIUM':
      case 'LOW':
        return list.filter((a) => a.severity === filter);
      case 'OPEN':
        return list.filter((a) => a.status === 'OPEN' || a.status === 'IN_PROGRESS');
      case 'RESOLVED':
        return list.filter((a) => a.status === 'RESOLVED');
      default:
        return list;
    }
  });

  ngOnInit(): void {
    this.timerId = setInterval(() => {
      this.nowTick.set(Date.now());
    }, 1000);

    this.loadData();
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  loadData(): void {
    this.alertCenterService.getKpis().subscribe((kpis) => {
      this.kpis.set(kpis);
    });

    this.alertCenterService.getAlerts().subscribe((alerts) => {
      this.alerts.set(alerts);
    });
  }

  setFilter(filter: AlertFilterType): void {
    this.selectedFilter.set(filter);
  }

  getFilterCount(filter: AlertFilterType): number {
    const list = this.alerts();
    switch (filter) {
      case 'ALL':
        return list.length;
      case 'CRITICAL':
      case 'HIGH':
      case 'MEDIUM':
      case 'LOW':
        return list.filter((a) => a.severity === filter).length;
      case 'OPEN':
        return list.filter((a) => a.status === 'OPEN' || a.status === 'IN_PROGRESS').length;
      case 'RESOLVED':
        return list.filter((a) => a.status === 'RESOLVED').length;
    }
  }

  getFilterLabel(filter: AlertFilterType): string {
    switch (filter) {
      case 'ALL':
        return this.languageService.t('alert_center.filter.all');
      case 'CRITICAL':
        return this.languageService.t('alert_center.filter.critical');
      case 'HIGH':
        return this.languageService.t('alert_center.filter.high');
      case 'MEDIUM':
        return this.languageService.t('alert_center.filter.medium');
      case 'LOW':
        return this.languageService.t('alert_center.filter.low');
      case 'OPEN':
        return this.languageService.t('alert_center.filter.open');
      case 'RESOLVED':
        return this.languageService.t('alert_center.filter.resolved');
    }
  }

  getSeverityLabel(severity: AlertSeverity): string {
    const isEs = this.languageService.currentLang() === 'es';
    switch (severity) {
      case 'CRITICAL':
        return isEs ? 'P1 - CRÍTICO' : 'P1 - CRITICAL';
      case 'HIGH':
        return isEs ? 'P2 - ELEVADO' : 'P2 - HIGH';
      case 'MEDIUM':
        return isEs ? 'P3 - MEDIO' : 'P3 - MEDIUM';
      case 'LOW':
        return isEs ? 'P4 - BAJO' : 'P4 - LOW';
    }
  }

  getSeverityBadgeClass(severity: AlertSeverity): string {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      case 'LOW':
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  }

  getCountdown(deadline: string | Date): { text: string; isBreached: boolean } {
    const deadlineMs = new Date(deadline).getTime();
    const diffMs = deadlineMs - this.nowTick();

    if (diffMs <= 0) {
      return {
        text: this.languageService.t('alert_center.sla_breached'),
        isBreached: true,
      };
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const seconds = totalSeconds % 60;

    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');

    return {
      text: `${hh}:${mm}:${ss}`,
      isBreached: false,
    };
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  }

  openResolveModal(alert: OperationalAlert): void {
    this.resolvingAlert.set(alert);
    this.resolutionNotes.set('');
  }

  closeResolveModal(): void {
    if (this.isResolving()) return;
    this.resolvingAlert.set(null);
    this.resolutionNotes.set('');
  }

  confirmResolution(): void {
    const alert = this.resolvingAlert();
    const notes = this.resolutionNotes().trim();
    if (!alert || !notes || this.isResolving()) return;

    this.isResolving.set(true);
    this.alertCenterService.resolveAlert(alert.id, notes).subscribe({
      next: (updated) => {
        this.alerts.update((items) =>
          items.map((item) => (item.id === updated.id ? updated : item))
        );
        this.alertCenterService.getKpis().subscribe((kpis) => {
          this.kpis.set(kpis);
        });
        this.isResolving.set(false);
        this.resolvingAlert.set(null);
        this.resolutionNotes.set('');
      },
      error: () => {
        this.isResolving.set(false);
      },
    });
  }
}
