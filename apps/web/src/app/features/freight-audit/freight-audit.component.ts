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
                5-Leg Freight Cost Audit Engine
              </h1>
              <p class="text-xs text-slate-400 mt-0.5">
                Automated multi-leg invoice reconciliation, tariff validation, demurrage detection, and variance auditing.
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
              <span>Exporting Matrix...</span>
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
              <span>Export to Excel (.xlsx)</span>
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
            <span class="text-xs font-medium text-slate-400">Total Contracted</span>
            <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              Target Baseline
            </span>
          </div>
          <div class="mt-2 text-2xl font-bold text-slate-100">
            {{ totalContracted() | currency: 'USD' : 'symbol' : '1.2-2' }}
          </div>
          <div class="mt-1 text-xs text-slate-400 flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            <span>Agreed tariff rate-cards</span>
          </div>
        </div>

        <!-- Total Actual Billed -->
        <div
          class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-slate-400">Total Actual Billed</span>
            <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              Invoiced
            </span>
          </div>
          <div class="mt-2 text-2xl font-bold text-slate-100">
            {{ totalActual() | currency: 'USD' : 'symbol' : '1.2-2' }}
          </div>
          <div class="mt-1 text-xs text-slate-400 flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            <span>Carrier invoice total</span>
          </div>
        </div>

        <!-- Net Variance ($ & %) -->
        <div
          class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-slate-400">Net Variance</span>
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
                ? 'Balanced against agreed contracts'
                : totalVariance() > 0
                  ? 'Cost overrun detected'
                  : 'Volume discount savings secured'
            }}
          </div>
        </div>

        <!-- Disputed Stages Count -->
        <div
          class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-slate-400">Disputed Stages</span>
            @if (isDisputed()) {
              <span
                class="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse"
              >
                Dispute Active
              </span>
            } @else {
              <span
                class="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
              >
                All Clear
              </span>
            }
          </div>
          <div
            class="mt-2 text-2xl font-bold"
            [ngClass]="isDisputed() ? 'text-rose-400' : 'text-slate-100'"
          >
            {{ disputedCount() }}
            <span class="text-sm font-normal text-slate-400">/ {{ stages().length }} legs</span>
          </div>
          <div class="mt-1 text-xs text-slate-400">
            {{
              isDisputed()
                ? 'Requires auditor justification / credit'
                : 'Zero tariff anomalies detected'
            }}
          </div>
        </div>
      </div>

      <!-- Shipment Selector Tabs -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Select Shipment Audit Target
            </span>
            <p class="text-xs text-slate-500 mt-0.5">
              Review 5-stage drayage, ocean/air, customs, rail, and final mile breakdown.
            </p>
          </div>
          <div class="text-xs text-slate-400 font-mono">
            Active: <span class="text-emerald-400 font-semibold">{{ selectedShipmentId() }}</span>
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
                  {{ shipment.subtitle }}
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
              5-Stage Reconciliation Matrix
            </h2>
            <p class="text-xs text-slate-400 mt-0.5">
              Granular comparison of contracted rate tariffs vs billed actuals with chromatic variance detection.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
              AUDIT-POLICY-2026
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
                <span class="text-blue-400">Leg {{ stage.stageOrder }}</span>
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
                <th class="px-4 py-3 text-center w-12">#</th>
                <th class="px-4 py-3">Stage / Leg Name</th>
                <th class="px-4 py-3">Contracted ($)</th>
                <th class="px-4 py-3">Actual ($)</th>
                <th class="px-4 py-3">Variance ($)</th>
                <th class="px-4 py-3">Variance (%)</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3">Audit Notes</th>
                <th class="px-4 py-3 text-right">Actions</th>
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
                      {{ stage.stageType }}
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
                      {{ stage.status }}
                    </span>
                  </td>

                  <!-- Audit Notes -->
                  <td class="px-4 py-3.5 max-w-xs text-slate-400 truncate" [title]="stage.auditNotes ?? 'No notes entered.'">
                    {{ stage.auditNotes || '—' }}
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
                      Edit/Audit
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
                    Audit Adjustment
                  </h3>
                  <p class="text-xs text-slate-400">
                    Leg {{ currentStage.stageOrder }}: {{ getStageLabel(currentStage.stageType) }} ({{ selectedShipmentId() }})
                  </p>
                </div>
              </div>
              <button
                type="button"
                (click)="closeEditModal()"
                class="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
                aria-label="Close modal"
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
                  <div class="text-xs text-slate-400">Baseline Contracted Tariff</div>
                  <div class="text-xs text-slate-500">Master Service Agreement agreed rate</div>
                </div>
                <div class="text-base font-mono font-bold text-slate-200">
                  {{ currentStage.contractedCost | currency: 'USD' : 'symbol' : '1.2-2' }}
                </div>
              </div>

              <!-- Actual Cost Input -->
              <div>
                <label for="actualCostInput" class="block text-xs font-medium text-slate-300 mb-1.5">
                  Actual Incurred Cost ($ USD) <span class="text-rose-400">*</span>
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
                    Actual cost must be a positive number.
                  </p>
                }
              </div>

              <!-- Live Preview Calculation Box -->
              <div class="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-2.5">
                <div class="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Live Variance Preview</span>
                  <span
                    class="text-[10px] px-2 py-0.5 rounded border"
                    [ngClass]="getVarianceBadgeClass(previewVariancePercent())"
                  >
                    {{ previewVariancePercent() > 0 ? '+' : '' }}{{ previewVariancePercent() | number: '1.2-2' }}%
                  </span>
                </div>
                <div class="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800/80">
                  <div>
                    <span class="text-[11px] text-slate-400 block">Calculated Variance</span>
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
                    <span class="text-[11px] text-slate-400 block">Auto-Status Detection</span>
                    <span
                      class="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                      [ngClass]="getStatusBadgeClass(previewStatus())"
                    >
                      {{ previewStatus() }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Status Override -->
              <div>
                <label for="statusSelect" class="block text-xs font-medium text-slate-300 mb-1.5">
                  Audit Status Override
                </label>
                <select
                  id="statusSelect"
                  formControlName="status"
                  (change)="onStatusSelectChange()"
                  class="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                >
                  <option value="APPROVED">APPROVED (Within tolerance / Verified)</option>
                  <option value="DISPUTED">DISPUTED (Flagged for carrier rebate/waiver)</option>
                  <option value="PENDING">PENDING (Awaiting supporting documents)</option>
                </select>
                <p class="mt-1 text-[11px] text-slate-500">
                  Rule: Automatically flags as <span class="text-rose-400 font-semibold">DISPUTED</span> when variance exceeds +5%.
                </p>
              </div>

              <!-- Audit Notes Textarea -->
              <div>
                <label for="auditNotesInput" class="block text-xs font-medium text-slate-300 mb-1.5">
                  Audit Notes & Discrepancy Justification
                </label>
                <textarea
                  id="auditNotesInput"
                  rows="3"
                  formControlName="auditNotes"
                  class="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  placeholder="Enter invoice discrepancy reasoning, tariff rule reference, or carrier dispute tracking..."
                ></textarea>
              </div>

              <!-- Modal Footer Actions -->
              <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  (click)="closeEditModal()"
                  class="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Cancel
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
                    <span>Saving...</span>
                  } @else {
                    <span>Save Audit Adjustment</span>
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
  totalContracted = computed(() =>
    this.stages().reduce((acc, s) => acc + s.contractedCost, 0)
  );

  totalActual = computed(() =>
    this.stages().reduce((acc, s) => acc + s.actualCost, 0)
  );

  totalVariance = computed(() =>
    Number((this.totalActual() - this.totalContracted()).toFixed(2))
  );

  variancePercent = computed(() => {
    const contracted = this.totalContracted();
    return contracted > 0
      ? Number(((this.totalVariance() / contracted) * 100).toFixed(2))
      : 0;
  });

  isDisputed = computed(() =>
    this.stages().some((s) => s.status === 'DISPUTED')
  );

  disputedCount = computed(() =>
    this.stages().filter((s) => s.status === 'DISPUTED').length
  );

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
        this.stages.set(stages);
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
        next: (updated) => {
          // Update stages signal array
          const updatedStages = this.stages().map((s) =>
            s.id === updated.id ? updated : s
          );
          this.stages.set(updatedStages);
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

  getStageLabel(stageType: StageType): string {
    switch (stageType) {
      case 'ORIGIN_HANDLING':
        return 'Origin Drayage';
      case 'TRANSIT_1':
        return 'International Transit 1';
      case 'CUSTOMS_BORDER':
        return 'Customs Clearance & Border Crossing';
      case 'TRANSIT_2':
        return 'International Transit 2';
      case 'FINAL_DESTINATION':
        return 'Final Mile Delivery';
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
