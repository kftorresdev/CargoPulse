import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alert-center',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
            <h1 class="text-2xl font-bold text-slate-100 tracking-tight">Operational Incidents & SLA Center</h1>
          </div>
          <p class="mt-1 text-sm text-slate-400">
            Real-time critical incident management, SLA breach countdown timers, automated escalation triggers, and carrier accountability.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <span class="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <span class="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
            3 Active Critical Alerts
          </span>
        </div>
      </div>

      <!-- KPI Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-slate-900/80 border border-rose-500/30 rounded-xl p-4 shadow-lg shadow-rose-950/20">
          <div class="flex items-center justify-between text-xs text-rose-400 font-medium">
            <span>Critical Breaches</span>
            <span class="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">Action Req</span>
          </div>
          <div class="mt-2 text-2xl font-bold text-rose-400">3</div>
          <div class="mt-1 text-xs text-slate-400">SLA exceeded &gt; 4 hours</div>
        </div>

        <div class="bg-slate-900/80 border border-amber-500/30 rounded-xl p-4 shadow-lg shadow-amber-950/20">
          <div class="flex items-center justify-between text-xs text-amber-400 font-medium">
            <span>At-Risk SLAs (&lt; 2 hrs)</span>
            <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          </div>
          <div class="mt-2 text-2xl font-bold text-amber-400">7</div>
          <div class="mt-1 text-xs text-slate-400">Under operational monitoring</div>
        </div>

        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div class="text-xs text-slate-400">Mean Time to Resolution (MTTR)</div>
          <div class="mt-2 text-2xl font-bold text-emerald-400">34 min</div>
          <div class="mt-1 text-xs text-slate-500">-12% vs prior month</div>
        </div>

        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div class="text-xs text-slate-400">Resolved Today</div>
          <div class="mt-2 text-2xl font-bold text-slate-100">28</div>
          <div class="mt-1 text-xs text-emerald-400">✓ 100% SLA compliance adherence</div>
        </div>
      </div>

      <!-- Live Countdowns & Incidents List Card -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div class="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            <h2 class="text-base font-semibold text-slate-200">Active Incident Stream with Live Escalation Countdowns</h2>
          </div>
          <div class="text-xs text-slate-400 font-mono">
            Auto-Escalation Engine: ACTIVE
          </div>
        </div>

        <div class="space-y-3">
          <!-- Incident 1 -->
          <div class="bg-slate-950/70 border border-rose-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">P1 - CRITICAL</span>
                <span class="font-mono text-xs text-slate-400">INC-2026-8819</span>
                <span class="text-xs text-slate-500">• Port of Rotterdam Congestion</span>
              </div>
              <p class="text-sm font-medium text-slate-200">Vessel Berth Delay Exceeding 18 Hours (MAERSK MC-KINNEY)</p>
              <p class="text-xs text-slate-400">340 Refrigerated Pharma Containers at risk of cold-chain deviation.</p>
            </div>
            <div class="flex sm:flex-col items-end justify-between sm:justify-center gap-1 shrink-0">
              <div class="text-[11px] text-rose-400 uppercase font-bold tracking-wider">Escalation Timer</div>
              <div class="text-lg font-mono font-bold text-rose-400 bg-rose-950/60 px-3 py-1 rounded border border-rose-800/40">
                00:38:12
              </div>
            </div>
          </div>

          <!-- Incident 2 -->
          <div class="bg-slate-950/70 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">P2 - ELEVATED</span>
                <span class="font-mono text-xs text-slate-400">INC-2026-8824</span>
                <span class="text-xs text-slate-500">• Chicago O'Hare Customs Hold</span>
              </div>
              <p class="text-sm font-medium text-slate-200">Missing Commercial Invoice Document for Manifest ORD-0941</p>
              <p class="text-xs text-slate-400">Air Freight Cargo grounded pending phytosanitary certificate verification.</p>
            </div>
            <div class="flex sm:flex-col items-end justify-between sm:justify-center gap-1 shrink-0">
              <div class="text-[11px] text-amber-400 uppercase font-bold tracking-wider">SLA Deadline</div>
              <div class="text-lg font-mono font-bold text-amber-400 bg-amber-950/60 px-3 py-1 rounded border border-amber-800/40">
                01:45:00
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AlertCenterComponent {}
