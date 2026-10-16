import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-freight-audit',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </span>
            <h1 class="text-2xl font-bold text-slate-100 tracking-tight">5-Leg Freight Cost Audit Engine</h1>
          </div>
          <p class="mt-1 text-sm text-slate-400">
            Automated multi-leg invoice reconciliation, tariff validation, demurrage detection, and variance auditing.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            class="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 shadow-sm shadow-emerald-900/30">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Audit Matrix (Excel)
          </button>
        </div>
      </div>

      <!-- Quick Metrics -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div class="text-xs text-slate-400">Audited Invoices (MTD)</div>
          <div class="mt-2 text-2xl font-bold text-slate-100">$2,481,950</div>
          <div class="mt-1 text-xs text-emerald-400">✓ 99.4% Contract Rate Accuracy</div>
        </div>

        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div class="text-xs text-slate-400">Disputed Surcharges</div>
          <div class="mt-2 text-2xl font-bold text-amber-400">$64,320</div>
          <div class="mt-1 text-xs text-slate-500">14 Invoices pending carrier credit</div>
        </div>

        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div class="text-xs text-slate-400">Recovered Savings</div>
          <div class="mt-2 text-2xl font-bold text-emerald-400">$189,400</div>
          <div class="mt-1 text-xs text-slate-500">Year-to-date recovered leakage</div>
        </div>

        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div class="text-xs text-slate-400">Audit Status</div>
          <div class="mt-2 text-2xl font-bold text-sky-400">Zero Backlog</div>
          <div class="mt-1 text-xs text-slate-500">Average cycle time: 1.2 hrs</div>
        </div>
      </div>

      <!-- 5-Stage Matrix Preview -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div class="flex items-center justify-between mb-5 border-b border-slate-800 pb-3">
          <div>
            <h2 class="text-base font-semibold text-slate-200">5-Stage Breakdown & Variance Matrix</h2>
            <p class="text-xs text-slate-400 mt-0.5">Automated comparison between contractual rate-cards and carrier actuals.</p>
          </div>
          <span class="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
            AUDIT-CYCLE-2026-Q4
          </span>
        </div>

        <!-- 5-Leg Stages Bar -->
        <div class="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
          <div class="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-center">
            <span class="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Leg 1</span>
            <div class="text-sm font-semibold text-slate-200 mt-1">Origin Drayage</div>
            <div class="text-xs text-emerald-400 mt-0.5">Matched (0% Var)</div>
          </div>

          <div class="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-center">
            <span class="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Leg 2</span>
            <div class="text-sm font-semibold text-slate-200 mt-1">Port Handling / THC</div>
            <div class="text-xs text-emerald-400 mt-0.5">Matched (0% Var)</div>
          </div>

          <div class="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-center">
            <span class="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Leg 3</span>
            <div class="text-sm font-semibold text-slate-200 mt-1">Main Ocean Freight</div>
            <div class="text-xs text-amber-400 mt-0.5">+4.2% BAF Surcharge</div>
          </div>

          <div class="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-center">
            <span class="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Leg 4</span>
            <div class="text-sm font-semibold text-slate-200 mt-1">Customs & Duties</div>
            <div class="text-xs text-emerald-400 mt-0.5">Tariff Verified</div>
          </div>

          <div class="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-center">
            <span class="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Leg 5</span>
            <div class="text-sm font-semibold text-slate-200 mt-1">Final Destination Rail</div>
            <div class="text-xs text-emerald-400 mt-0.5">Matched (0% Var)</div>
          </div>
        </div>

        <!-- Sample preview table -->
        <div class="overflow-x-auto rounded-lg border border-slate-800">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th class="px-4 py-3">Carrier / Reference</th>
                <th class="px-4 py-3">Contract Rate</th>
                <th class="px-4 py-3">Billed Amount</th>
                <th class="px-4 py-3">Variance</th>
                <th class="px-4 py-3">Leg Category</th>
                <th class="px-4 py-3 text-right">Audit Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 bg-slate-900/40">
              <tr class="hover:bg-slate-800/30">
                <td class="px-4 py-3 font-mono text-slate-200">MSK-LINE-884109</td>
                <td class="px-4 py-3">$4,250.00</td>
                <td class="px-4 py-3 font-medium text-slate-100">$4,250.00</td>
                <td class="px-4 py-3 text-emerald-400">$0.00 (0%)</td>
                <td class="px-4 py-3 text-slate-400">Leg 3: Ocean Freight</td>
                <td class="px-4 py-3 text-right">
                  <span class="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Approved</span>
                </td>
              </tr>
              <tr class="hover:bg-slate-800/30">
                <td class="px-4 py-3 font-mono text-slate-200">CMA-CGM-991204</td>
                <td class="px-4 py-3">$1,100.00</td>
                <td class="px-4 py-3 font-medium text-amber-400">$1,350.00</td>
                <td class="px-4 py-3 text-rose-400">+$250.00 (+22.7%)</td>
                <td class="px-4 py-3 text-slate-400">Leg 2: Port Demurrage</td>
                <td class="px-4 py-3 text-right">
                  <span class="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">Under Review</span>
                </td>
              </tr>
              <tr class="hover:bg-slate-800/30">
                <td class="px-4 py-3 font-mono text-slate-200">HAPAG-LLOYD-4011</td>
                <td class="px-4 py-3">$850.00</td>
                <td class="px-4 py-3 font-medium text-slate-100">$850.00</td>
                <td class="px-4 py-3 text-emerald-400">$0.00 (0%)</td>
                <td class="px-4 py-3 text-slate-400">Leg 1: Drayage Terminal</td>
                <td class="px-4 py-3 text-right">
                  <span class="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Approved</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class FreightAuditComponent {}
