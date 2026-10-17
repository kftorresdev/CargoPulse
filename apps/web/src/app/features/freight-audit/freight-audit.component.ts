import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  FreightAuditSummary,
  FreightStage,
  StageStatus,
  StageType,
} from './models/freight-audit.model';
import { FreightAuditService } from './services/freight-audit.service';
import { LanguageService } from '@core/services/language.service';

interface ShipmentOption {
  id: string;
  title: string;
  subtitle: string;
  carrier: string;
  route: string;
}

@Component({
  selector: 'app-freight-audit',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div
        class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5"
      >
        <div>
          <div class="flex items-center gap-2.5">
            <span
              class="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner"
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
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </span>
            <div>
              <h1 class="text-2xl font-bold text-slate-100 tracking-tight">
                {{ languageService.t('freight_audit.title') }}
              </h1>
              <p class="text-xs text-slate-400 mt-0.5">
                {{ languageService.t('freight_audit.subtitle') }}
              </p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            (click)="exportExcel()"
            [disabled]="isExporting()"
            class="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white transition-all flex items-center gap-2 shadow-lg shadow-emerald-950/40"
          >
            @if (isExporting()) {
              <svg
                class="w-4 h-4 animate-spin text-white"
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>{{ languageService.t('freight_audit.exporting') }}</span>
            } @else {
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
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>{{ languageService.t('freight_audit.export_excel') }}</span>
            }
          </button>
        </div>
      </div>

      <!-- Financial KPI Header Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Contracted Baseline -->
        <div
          class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-slate-400">{{ languageService.t('freight_audit.kpi.total_contracted') }}</span>
            <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {{ languageService.t('freight_audit.kpi.target_baseline') }}
            </span>
          </div>
          <div class="mt-2 text-2xl font-bold text-slate-100">
            {{ totalContracted() | currency: 'USD' : 'symbol' : '1.2-2' }}
          </div>
          <div class="mt-1 text-xs text-slate-400 flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            <span>{{ languageService.t('freight_audit.kpi.agreed_tariffs') }}</span>
          </div>
        </div>

        <!-- Total Actual Billed -->
        <div
          class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-slate-400">{{ languageService.t('freight_audit.kpi.total_actual') }}</span>
            <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {{ languageService.t('freight_audit.kpi.invoiced') }}
            </span>
          </div>
          <div class="mt-2 text-2xl font-bold text-slate-100">
            {{ totalActual() | currency: 'USD' : 'symbol' : '1.2-2' }}
          </div>
          <div class="mt-1 text-xs text-slate-400 flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            <span>{{ languageService.t('freight_audit.kpi.carrier_invoice_total') }}</span>
          </div>
        </div>

        <!-- Net Variance ($ & %) -->
        <div
          class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-slate-400">{{ languageService.t('freight_audit.kpi.net_variance') }}</span>
            <span
              class="text-[10px] uppercase font-mono px-2 py-0.5 rounded border"
              [ngClass]="getVarianceBadgeClass(variancePercent())"
            >
              {{ variancePercent() > 0 ? '+' : '' }}{{ variancePercent() | number: '1.2-2' }}%
            </span>
          </div>
          <div
            class="mt-2 text-2xl font-bold"
            [ngClass]="
              totalVariance() > 0
                ? 'text-rose-400'
                : totalVariance() < 0
                  ? 'text-emerald-400'
                  : 'text-slate-100'
            "
          >
            {{ totalVariance() > 0 ? '+' : '' }}{{ totalVariance() | currency: 'USD' : 'symbol' : '1.2-2' }}
          </div>
          <div class="mt-1 text-xs text-slate-400">
            {{
              totalVariance() === 0
                ? languageService.t('freight_audit.kpi.balanced')
                : totalVariance() > 0
                  ? languageService.t('freight_audit.kpi.cost_overrun')
                  : languageService.t('freight_audit.kpi.savings')
            }}
          </div>
        </div>

        <!-- Disputed Stages Count -->
        <div
          class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-slate-400">{{ languageService.t('freight_audit.kpi.disputed_stages') }}</span>
            @if (isDisputed()) {
              <span
                class="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse"
              >
                {{ languageService.t('freight_audit.kpi.dispute_active') }}
              </span>
            } @else {
              <span
                class="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
              >
                {{ languageService.t('freight_audit.kpi.all_clear') }}
              </span>
            }
          </div>
          <div
            class="mt-2 text-2xl font-bold"
            [ngClass]="isDisputed() ? 'text-rose-400' : 'text-slate-100'"
          >
            {{ disputedCount() }}
            <span class="text-sm font-normal text-slate-400">/ {{ (stages() || []).length }} {{ languageService.t('freight_audit.kpi.legs') }}</span>
          </div>
          <div class="mt-1 text-xs text-slate-400">
            {{
              isDisputed()
                ? languageService.t('freight_audit.kpi.requires_justification')
                : languageService.t('freight_audit.kpi.zero_anomalies')
            }}
          </div>
        </div>
      </div>

      <!-- Shipment Selector Tabs -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {{ languageService.t('freight_audit.selector.title') }}
            </span>
            <p class="text-xs text-slate-500 mt-0.5">
              {{ languageService.t('freight_audit.selector.subtitle') }}
            </p>
          </div>
          <div class="text-xs text-slate-400 font-mono">
            {{ languageService.t('freight_audit.selector.active') }}: <span class="text-emerald-400 font-semibold">{{ selectedShipmentId() }}</span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          @for (shipment of shipments; track shipment.id) {
            <button
              type="button"
              (click)="selectShipment(shipment.id)"
              [class.border-emerald-500]="selectedShipmentId() === shipment.id"
              [class.bg-emerald-950/20]="selectedShipmentId() === shipment.id"
              [class.border-slate-800]="selectedShipmentId() !== shipment.id"
              [class.bg-slate-950/60]="selectedShipmentId() !== shipment.id"
              class="border rounded-xl p-3.5 text-left transition-all hover:border-slate-700 cursor-pointer flex flex-col justify-between"
            >
              <div class="flex items-center justify-between mb-1.5">
                <span class="font-mono text-sm font-semibold text-slate-100">
                  {{ shipment.title }}
                </span>
                <span
                  class="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  [ngClass]="
                    shipment.id === 'CP-2026-X9810'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      : shipment.id === 'CP-2026-E4421'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  "
                >
                  {{ getShipmentSubtitle(shipment.id) }}
                </span>
              </div>
              <div class="text-xs text-slate-400 flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80">
                <span>{{ shipment.carrier }}</span>
                <span class="text-[11px] text-slate-500">{{ shipment.route }}</span>
              </div>
            </button>
          }
        </div>
      </div>

      <!-- 5-Stage Reconciliation Matrix Table -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 border-b border-slate-800 pb-4">
          <div>
            <h2 class="text-base font-semibold text-slate-200">
              {{ languageService.t('freight_audit.matrix.title') }}
            </h2>
            <p class="text-xs text-slate-400 mt-0.5">
              {{ languageService.t('freight_audit.matrix.subtitle') }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {{ languageService.t('freight_audit.matrix.policy') }}
            </span>
          </div>
        </div>

        <!-- 5-Leg Pipeline Visual Bar -->
        <div class="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
          @for (stage of stages(); track stage.id) {
            <div
              class="bg-slate-950/80 border rounded-xl p-3 text-center transition-all"
              [ngClass]="
                stage.status === 'DISPUTED'
                  ? 'border-rose-500/40 bg-rose-950/10'
                  : stage.status === 'APPROVED'
                    ? 'border-emerald-500/30'
                    : 'border-slate-800'
              "
            >
              <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-1">
                <span class="text-blue-400">{{ languageService.t('freight_audit.matrix.leg') }} {{ stage.stageOrder }}</span>
                <span
                  class="px-1.5 py-0.2 rounded font-mono text-[9px] border"
                  [ngClass]="getVarianceBadgeClass(stage.variancePercent)"
                >
                  {{ stage.variancePercent > 0 ? '+' : '' }}{{ stage.variancePercent | number: '1.1-1' }}%
                </span>
              </div>
              <div class="text-xs font-semibold text-slate-200 truncate" [title]="getStageLabel(stage.stageType)">
                {{ getStageLabel(stage.stageType) }}
              </div>
              <div class="text-[11px] font-mono text-slate-300 mt-1">
                {{ stage.actualCost | currency: 'USD' : 'symbol' : '1.0-0' }}
              </div>
            </div>
          }
        </div>

        <!-- Matrix Table -->
        <div class="overflow-x-auto rounded-xl border border-slate-800 shadow-sm">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th class="px-4 py-3 text-center w-12">{{ languageService.t('freight_audit.table.num') }}</th>
                <th class="px-4 py-3">{{ languageService.t('freight_audit.table.stage_name') }}</th>
                <th class="px-4 py-3">{{ languageService.t('freight_audit.table.contracted') }}</th>
                <th class="px-4 py-3">{{ languageService.t('freight_audit.table.actual') }}</th>
                <th class="px-4 py-3">{{ languageService.t('freight_audit.table.variance') }}</th>
                <th class="px-4 py-3">{{ languageService.t('freight_audit.table.variance_pct') }}</th>
                <th class="px-4 py-3">{{ languageService.t('freight_audit.table.status') }}</th>
                <th class="px-4 py-3">{{ languageService.t('freight_audit.table.audit_notes') }}</th>
                <th class="px-4 py-3 text-right">{{ languageService.t('freight_audit.table.actions') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 bg-slate-900/40">
              @for (stage of stages(); track stage.id) {
                <tr class="hover:bg-slate-800/40 transition-colors">
                  <!-- Stage Order -->
                  <td class="px-4 py-3.5 text-center font-mono text-slate-400 font-semibold">
                    {{ stage.stageOrder }}
                  </td>

                  <!-- Stage Name -->
                  <td class="px-4 py-3.5">
                    <div class="font-medium text-slate-100">
                      {{ getStageLabel(stage.stageType) }}
                    </div>
                    <div class="text-[10px] font-mono text-slate-500 uppercase mt-0.5">
                      {{ getStageCodeLabel(stage.stageType) }}
                    </div>
                  </td>

                  <!-- Contracted -->
                  <td class="px-4 py-3.5 font-mono text-slate-300">
                    {{ stage.contractedCost | currency: 'USD' : 'symbol' : '1.2-2' }}
                  </td>

                  <!-- Actual -->
                  <td class="px-4 py-3.5 font-mono font-medium text-slate-100">
                    {{ stage.actualCost | currency: 'USD' : 'symbol' : '1.2-2' }}
                  </td>

                  <!-- Variance ($) -->
                  <td
                    class="px-4 py-3.5 font-mono font-medium"
                    [ngClass]="
                      stage.variance > 0
                        ? 'text-rose-400'
                        : stage.variance < 0
                          ? 'text-emerald-400'
                          : 'text-slate-400'
                    "
                  >
                    {{ stage.variance > 0 ? '+' : '' }}{{ stage.variance | currency: 'USD' : 'symbol' : '1.2-2' }}
                  </td>

                  <!-- Variance (%) Chromatic Badge -->
                  <td class="px-4 py-3.5">
                    <span
                      class="px-2 py-0.5 rounded text-[10px] font-mono border font-semibold inline-flex items-center gap-1"
                      [ngClass]="getVarianceBadgeClass(stage.variancePercent)"
                    >
                      <span>{{ stage.variancePercent > 0 ? '+' : '' }}{{ stage.variancePercent | number: '1.2-2' }}%</span>
                    </span>
                  </td>

                  <!-- Status Badge -->
                  <td class="px-4 py-3.5">
                    <span
                      class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border inline-flex items-center gap-1"
                      [ngClass]="getStatusBadgeClass(stage.status)"
                    >
                      <span
                        class="w-1.5 h-1.5 rounded-full"
                        [ngClass]="
                          stage.status === 'APPROVED'
                            ? 'bg-emerald-400'
                            : stage.status === 'DISPUTED'
                              ? 'bg-rose-400'
                              : 'bg-sky-400'
                        "
                      ></span>
                      {{ getStatusLabel(stage.status) }}
                    </span>
                  </td>

                  <!-- Audit Notes -->
                  <td class="px-4 py-3.5 max-w-xs text-slate-400 truncate" [title]="stage.auditNotes ? formatAuditNote(stage.auditNotes) : languageService.t('freight_audit.table.no_notes')">
                    {{ formatAuditNote(stage.auditNotes) || '—' }}
                  </td>

                  <!-- Edit/Audit Action Button -->
                  <td class="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      (click)="openEditModal(stage)"
                      class="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-colors inline-flex items-center gap-1.5"
                    >
                      <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      {{ languageService.t('freight_audit.table.edit_audit') }}
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Audit Adjustment Modal / Drawer -->
      @if (editingStage(); as currentStage) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div
            class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <!-- Modal Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div class="flex items-center gap-2.5">
                <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </span>
                <div>
                  <h3 class="text-base font-semibold text-slate-100">
                    {{ languageService.t('freight_audit.modal.title') }}
                  </h3>
                  <p class="text-xs text-slate-400">
                    {{ languageService.t('freight_audit.modal.leg_info', { leg: currentStage.stageOrder, stage: getStageLabel(currentStage.stageType), shipment: selectedShipmentId() }) }}
                  </p>
                </div>
              </div>
              <button
                type="button"
                (click)="closeEditModal()"
                class="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
                [attr.aria-label]="languageService.t('freight_audit.modal.close')"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Modal Body Form -->
            <form [formGroup]="auditForm" (ngSubmit)="saveAdjustment()" class="p-6 space-y-5">
              <!-- Contracted Reference (Read-only) -->
              <div class="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <div class="text-xs text-slate-400">{{ languageService.t('freight_audit.modal.baseline_tariff') }}</div>
                  <div class="text-xs text-slate-500">{{ languageService.t('freight_audit.modal.msa_agreed_rate') }}</div>
                </div>
                <div class="text-base font-mono font-bold text-slate-200">
                  {{ currentStage.contractedCost | currency: 'USD' : 'symbol' : '1.2-2' }}
                </div>
              </div>

              <!-- Actual Cost Input -->
              <div>
                <label for="actualCostInput" class="block text-xs font-medium text-slate-300 mb-1.5">
                  {{ languageService.t('freight_audit.modal.actual_cost') }} <span class="text-rose-400">*</span>
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    $
                  </span>
                  <input
                    id="actualCostInput"
                    type="number"
                    step="0.01"
                    min="0"
                    formControlName="actualCost"
                    (input)="onCostInputChange()"
                    class="w-full pl-8 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    placeholder="0.00"
                  />
                </div>
                @if (auditForm.controls.actualCost.invalid && auditForm.controls.actualCost.touched) {
                  <p class="mt-1 text-xs text-rose-400">
                    {{ languageService.t('freight_audit.modal.actual_cost_error') }}
                  </p>
                }
              </div>

              <!-- Live Preview Calculation Box -->
              <div class="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-2.5">
                <div class="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>{{ languageService.t('freight_audit.modal.live_variance_preview') }}</span>
                  <span
                    class="text-[10px] px-2 py-0.5 rounded border"
                    [ngClass]="getVarianceBadgeClass(previewVariancePercent())"
                  >
                    {{ previewVariancePercent() > 0 ? '+' : '' }}{{ previewVariancePercent() | number: '1.2-2' }}%
                  </span>
                </div>
                <div class="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800/80">
                  <div>
                    <span class="text-[11px] text-slate-400 block">{{ languageService.t('freight_audit.modal.calculated_variance') }}</span>
                    <span
                      class="text-sm font-mono font-bold"
                      [ngClass]="
                        previewVariance() > 0
                          ? 'text-rose-400'
                          : previewVariance() < 0
                            ? 'text-emerald-400'
                            : 'text-slate-300'
                      "
                    >
                      {{ previewVariance() > 0 ? '+' : '' }}{{ previewVariance() | currency: 'USD' : 'symbol' : '1.2-2' }}
                    </span>
                  </div>
                  <div>
                    <span class="text-[11px] text-slate-400 block">{{ languageService.t('freight_audit.modal.auto_status_detection') }}</span>
                    <span
                      class="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                      [ngClass]="getStatusBadgeClass(previewStatus())"
                    >
                      {{ getStatusLabel(previewStatus()) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Status Override -->
              <div>
                <label for="statusSelect" class="block text-xs font-medium text-slate-300 mb-1.5">
                  {{ languageService.t('freight_audit.modal.status_override') }}
                </label>
                <select
                  id="statusSelect"
                  formControlName="status"
                  (change)="onStatusSelectChange()"
                  class="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                >
                  <option value="APPROVED">{{ languageService.t('freight_audit.modal.status_approved') }}</option>
                  <option value="DISPUTED">{{ languageService.t('freight_audit.modal.status_disputed') }}</option>
                  <option value="PENDING">{{ languageService.t('freight_audit.modal.status_pending') }}</option>
                </select>
                <p class="mt-1 text-[11px] text-slate-500">
                  {{ languageService.t('freight_audit.modal.rule_note') }}
                </p>
              </div>

              <!-- Audit Notes Textarea -->
              <div>
                <label for="auditNotesInput" class="block text-xs font-medium text-slate-300 mb-1.5">
                  {{ languageService.t('freight_audit.modal.audit_notes') }}
                </label>
                <textarea
                  id="auditNotesInput"
                  rows="3"
                  formControlName="auditNotes"
                  class="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  [placeholder]="languageService.t('freight_audit.modal.notes_placeholder')"
                ></textarea>
              </div>

              <!-- Modal Footer Actions -->
              <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  (click)="closeEditModal()"
                  class="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  {{ languageService.t('freight_audit.modal.cancel') }}
                </button>
                <button
                  type="submit"
                  [disabled]="auditForm.invalid || isSavingStage()"
                  class="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all flex items-center gap-2 shadow-lg shadow-emerald-950/40"
                >
                  @if (isSavingStage()) {
                    <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{{ languageService.t('freight_audit.modal.saving') }}</span>
                  } @else {
                    <span>{{ languageService.t('freight_audit.modal.save') }}</span>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
})
export class FreightAuditComponent implements OnInit {
  private readonly freightAuditService = inject(FreightAuditService);
  readonly languageService = inject(LanguageService);

  private readonly seedNotesTranslations: Record<string, string> = {
    'Export documentation and container drayage verified.':
      'Documentación de exportación y arrastre de contenedor verificados.',
    'Bunker adjustment factor surcharge disputed with ocean carrier.':
      'Recargo por factor de ajuste de combustible (BAF) en disputa con naviera.',
    'Intensive exam fee applied due to random CBP inspection.':
      'Cargo por revisión intensiva aplicado debido a inspección aleatoria de CBP.',
    'Rail intermodal booking confirmed.':
      'Reserva intermodal ferroviaria confirmada.',
    'Final warehouse delivery scheduled.':
      'Entrega final en almacén programada.',
    'Origin terminal handling fees matched contract.':
      'Cargos por manejo en terminal de origen coinciden con el contrato.',
    'Transatlantic ocean freight cleared.':
      'Flete marítimo transatlántico liquidado.',
    'Cleared Newark entry via automated commercial environment.':
      'Entrada por Newark liberada vía entorno comercial automatizado (ACE).',
    'Chassis split charge added without prior notification.':
      'Cargo por separación de chasis agregado sin notificación previa.',
    'Cross-dock delivery window booked for 14:00 CST.':
      'Ventana de entrega cross-dock reservada para las 14:00 CST.',
    'Cold chain verification passed at ICN warehouse.':
      'Verificación de cadena de frío aprobada en almacén ICN.',
    'Air freight under contracted volume tier rebate applied.':
      'Reembolso aplicado por nivel de volumen contratado en flete aéreo.',
    'EU customs entry processed under ATLAS system.':
      'Entrada aduanal en la UE procesada bajo el sistema ATLAS.',
    'Temperature controlled dedicated truck to distribution center.':
      'Camión dedicado con control de temperatura hacia centro de distribución.',
    'Proof of Delivery signed and archived in document store.':
      'Comprobante de entrega (POD) firmado y archivado en repositorio documental.',
  };

  readonly shipments: ShipmentOption[] = [
    {
      id: 'CP-2026-X9810',
      title: 'CP-2026-X9810',
      subtitle: 'Ocean / Customs Hold',
      carrier: 'OceanBridge Global',
      route: 'Shanghai → Los Angeles',
    },
    {
      id: 'CP-2026-E4421',
      title: 'CP-2026-E4421',
      subtitle: 'Chassis Variance',
      carrier: 'Maersk Line',
      route: 'Rotterdam → Chicago',
    },
    {
      id: 'CP-2026-A1092',
      title: 'CP-2026-A1092',
      subtitle: 'Clean Air Cargo',
      carrier: 'Lufthansa Cargo',
      route: 'Incheon → Frankfurt',
    },
  ];

  // State Signals
  summary = signal<FreightAuditSummary | null>(null);
  selectedShipmentId = signal<string>('CP-2026-X9810');
  stages = signal<FreightStage[]>([]);
  editingStage = signal<FreightStage | null>(null);
  isExporting = signal<boolean>(false);
  isSavingStage = signal<boolean>(false);

  // Live modal preview signals
  previewActualCost = signal<number>(0);
  previewStatus = signal<StageStatus>('PENDING');

  // Computed Financial Metrics for current shipment
  totalContracted = computed(() => {
    const list = Array.isArray(this.stages()) ? this.stages() : [];
    return list.reduce((acc, s) => acc + s.contractedCost, 0);
  });

  totalActual = computed(() => {
    const list = Array.isArray(this.stages()) ? this.stages() : [];
    return list.reduce((acc, s) => acc + s.actualCost, 0);
  });

  totalVariance = computed(() =>
    Number((this.totalActual() - this.totalContracted()).toFixed(2))
  );

  variancePercent = computed(() => {
    const contracted = this.totalContracted();
    return contracted > 0
      ? Number(((this.totalVariance() / contracted) * 100).toFixed(2))
      : 0;
  });

  isDisputed = computed(() => {
    const list = Array.isArray(this.stages()) ? this.stages() : [];
    return list.some((s) => s.status === 'DISPUTED');
  });

  disputedCount = computed(() => {
    const list = Array.isArray(this.stages()) ? this.stages() : [];
    return list.filter((s) => s.status === 'DISPUTED').length;
  });

  // Live preview calculations for the adjustment modal
  previewVariance = computed(() => {
    const stage = this.editingStage();
    if (!stage) return 0;
    return Number((this.previewActualCost() - stage.contractedCost).toFixed(2));
  });

  previewVariancePercent = computed(() => {
    const stage = this.editingStage();
    if (!stage || stage.contractedCost <= 0) return 0;
    return Number(
      ((this.previewVariance() / stage.contractedCost) * 100).toFixed(2)
    );
  });

  readonly auditForm = new FormGroup({
    actualCost: new FormControl<number>(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    auditNotes: new FormControl<string>('', { nonNullable: true }),
    status: new FormControl<StageStatus>('PENDING', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.loadSummary();
    this.loadStages(this.selectedShipmentId());
  }

  loadSummary(): void {
    this.freightAuditService.getSummary().subscribe({
      next: (summary) => this.summary.set(summary),
    });
  }

  loadStages(shipmentId: string): void {
    this.freightAuditService.getShipmentAudit(shipmentId).subscribe({
      next: (stages) => {
        const raw = (stages as any)?.data ?? stages;
        const stageList = Array.isArray(raw) ? raw : [];
        this.stages.set(stageList);
      },
    });
  }

  selectShipment(shipmentId: string): void {
    this.selectedShipmentId.set(shipmentId);
    this.loadStages(shipmentId);
  }

  exportExcel(): void {
    this.isExporting.set(true);
    this.freightAuditService.exportExcel().subscribe({
      next: () => {
        this.isExporting.set(false);
      },
      error: () => {
        this.isExporting.set(false);
      },
    });
  }

  openEditModal(stage: FreightStage): void {
    this.editingStage.set(stage);
    this.previewActualCost.set(stage.actualCost);
    this.previewStatus.set(stage.status);

    this.auditForm.setValue({
      actualCost: stage.actualCost,
      auditNotes: stage.auditNotes ?? '',
      status: stage.status,
    });
  }

  closeEditModal(): void {
    this.editingStage.set(null);
  }

  onCostInputChange(): void {
    const actualCost = this.auditForm.controls.actualCost.value;
    if (actualCost !== null && actualCost !== undefined) {
      this.previewActualCost.set(actualCost);

      const stage = this.editingStage();
      if (stage && stage.contractedCost > 0) {
        const variance = actualCost - stage.contractedCost;
        const variancePct = (variance / stage.contractedCost) * 100;

        let autoStatus: StageStatus = 'PENDING';
        if (variancePct > 5) {
          autoStatus = 'DISPUTED';
        } else if (variancePct <= 0) {
          autoStatus = 'APPROVED';
        } else {
          autoStatus = stage.status;
        }

        this.previewStatus.set(autoStatus);
        this.auditForm.controls.status.setValue(autoStatus);
      }
    }
  }

  onStatusSelectChange(): void {
    this.previewStatus.set(this.auditForm.controls.status.value);
  }

  saveAdjustment(): void {
    const stage = this.editingStage();
    if (!stage || this.auditForm.invalid) {
      return;
    }

    this.isSavingStage.set(true);
    const formValue = this.auditForm.getRawValue();

    this.freightAuditService
      .updateStageAudit(stage.id, {
        actualCost: Number(formValue.actualCost),
        auditNotes: formValue.auditNotes,
        status: formValue.status,
      })
      .subscribe({
        next: (updatedStage) => {
          const actualUpdated: FreightStage =
            (updatedStage as any)?.data ?? updatedStage;
          this.stages.update((current) =>
            (Array.isArray(current) ? current : []).map((s) =>
              s.id === actualUpdated.id ? actualUpdated : s
            )
          );
          this.isSavingStage.set(false);
          this.closeEditModal();
          // Reload summary to reflect adjustments in portfolio
          this.loadSummary();
        },
        error: () => {
          this.isSavingStage.set(false);
        },
      });
  }

  getShipmentSubtitle(id: string): string {
    const key = `freight_audit.shipment.${id}.subtitle`;
    const translated = this.languageService.t(key);
    if (translated !== key) {
      return translated;
    }
    const found = this.shipments.find((s) => s.id === id);
    return found?.subtitle ?? '';
  }

  getStatusLabel(status: StageStatus): string {
    const key = `freight_audit.status.${status}`;
    const translated = this.languageService.t(key);
    return translated === key ? status : translated;
  }

  getStageCodeLabel(stageType: StageType): string {
    const key = `freight_audit.stage_code.${stageType}`;
    const translated = this.languageService.t(key);
    return translated === key ? stageType : translated;
  }

  formatAuditNote(note: string | null | undefined): string {
    if (!note) return '';
    if (this.languageService.currentLang() === 'es') {
      return this.seedNotesTranslations[note] ?? note;
    }
    return note;
  }

  getStageLabel(stageType: StageType): string {
    switch (stageType) {
      case 'ORIGIN_HANDLING':
        return this.languageService.t('freight_audit.stage.origin_handling');
      case 'TRANSIT_1':
        return this.languageService.t('freight_audit.stage.transit_1');
      case 'CUSTOMS_BORDER':
        return this.languageService.t('freight_audit.stage.customs_border');
      case 'TRANSIT_2':
        return this.languageService.t('freight_audit.stage.transit_2');
      case 'FINAL_DESTINATION':
        return this.languageService.t('freight_audit.stage.final_destination');
      default:
        return stageType;
    }
  }

  getVarianceBadgeClass(variancePercent: number): string {
    if (variancePercent <= 0) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    } else if (variancePercent <= 5) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    } else {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
  }

  getStatusBadgeClass(status: StageStatus): string {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'DISPUTED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'PENDING':
      default:
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
    }
  }
}
