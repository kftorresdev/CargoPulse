import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-control-tower',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" stroke-width="2"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3a9 9 0 0 1 9 9m-9-9a9 9 0 0 0-9 9m9-9v18m-9-9h18"/>
              </svg>
            </span>
            <h1 class="text-2xl font-bold text-slate-100 tracking-tight">Control Tower & Topology DAG</h1>
          </div>
          <p class="mt-1 text-sm text-slate-400">
            Real-time multi-modal logistics topology, supply chain node telemetry, and automated routing graph.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            DAG Live Sync Active
          </span>
          <button
            type="button"
            class="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-900/30">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Telemetry
          </button>
        </div>
      </div>

      <!-- Quick KPI Strip -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div class="flex items-center justify-between text-xs text-slate-400">
            <span>Active DAG Nodes</span>
            <span class="text-emerald-400 font-semibold">+12.5%</span>
          </div>
          <div class="mt-2 text-2xl font-bold text-slate-100">142</div>
          <div class="mt-1 text-xs text-slate-500">Seaports, Air Hubs & Rail Heads</div>
        </div>

        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div class="flex items-center justify-between text-xs text-slate-400">
            <span>In-Transit Shipments</span>
            <span class="text-blue-400 font-semibold">Live</span>
          </div>
          <div class="mt-2 text-2xl font-bold text-slate-100">1,849</div>
          <div class="mt-1 text-xs text-slate-500">38 Vessels, 91 Air Cargo Flights</div>
        </div>

        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div class="flex items-center justify-between text-xs text-slate-400">
            <span>On-Time Arrival (OTA)</span>
            <span class="text-emerald-400 font-semibold">96.8%</span>
          </div>
          <div class="mt-2 text-2xl font-bold text-slate-100">97.2%</div>
          <div class="mt-1 text-xs text-slate-500">Target SLA: ≥ 95.0%</div>
        </div>

        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div class="flex items-center justify-between text-xs text-slate-400">
            <span>Critical Bottlenecks</span>
            <span class="text-amber-400 font-semibold">2 Detected</span>
          </div>
          <div class="mt-2 text-2xl font-bold text-amber-400">2</div>
          <div class="mt-1 text-xs text-slate-500">Port of Rotterdam, Suez Canal</div>
        </div>
      </div>

      <!-- Main Visual Placeholder Card -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div class="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <h2 class="text-base font-semibold text-slate-200">Interactive Directed Acyclic Graph (ngx-graph preview)</h2>
          </div>
          <div class="flex items-center gap-2 text-xs text-slate-400">
            <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Pan & Zoom Enabled</span>
            <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Hierarchical Layout</span>
          </div>
        </div>

        <!-- Canvas simulation container -->
        <div class="min-h-[380px] rounded-xl border border-dashed border-slate-700/60 bg-slate-950/70 p-6 flex flex-col items-center justify-center relative">
          <!-- Ambient glowing node mockup -->
          <div class="w-full max-w-2xl grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
            <!-- Node 1 -->
            <div class="bg-slate-900 border border-blue-500/40 rounded-xl p-4 shadow-lg shadow-blue-500/5 relative">
              <div class="flex items-center justify-between text-xs font-mono text-blue-400 mb-1">
                <span>NODE_01</span>
                <span class="w-2 h-2 rounded-full bg-blue-400"></span>
              </div>
              <div class="font-bold text-slate-200 text-sm">Shanghai Terminal (PVG)</div>
              <div class="text-xs text-slate-400 mt-1">Origin Drayage & Customs Gate</div>
              <div class="mt-3 pt-2 border-t border-slate-800 flex justify-between text-[11px] text-slate-400">
                <span>Throughput</span>
                <span class="font-mono text-slate-200">2,410 TEU/d</span>
              </div>
            </div>

            <!-- Node 2 (Center) -->
            <div class="bg-slate-900 border border-emerald-500/40 rounded-xl p-4 shadow-lg shadow-emerald-500/5 relative">
              <div class="flex items-center justify-between text-xs font-mono text-emerald-400 mb-1">
                <span>NODE_02</span>
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              </div>
              <div class="font-bold text-slate-200 text-sm">Ocean Corridor Transshipment</div>
              <div class="text-xs text-slate-400 mt-1">Singapore Hub (SGSIN)</div>
              <div class="mt-3 pt-2 border-t border-slate-800 flex justify-between text-[11px] text-slate-400">
                <span>Latency</span>
                <span class="font-mono text-slate-200">18.4 hrs (Optimal)</span>
              </div>
            </div>

            <!-- Node 3 -->
            <div class="bg-slate-900 border border-purple-500/40 rounded-xl p-4 shadow-lg shadow-purple-500/5 relative">
              <div class="flex items-center justify-between text-xs font-mono text-purple-400 mb-1">
                <span>NODE_03</span>
                <span class="w-2 h-2 rounded-full bg-purple-400"></span>
              </div>
              <div class="font-bold text-slate-200 text-sm">Long Beach Harbor (USLGB)</div>
              <div class="text-xs text-slate-400 mt-1">Destination Railhead Ingestion</div>
              <div class="mt-3 pt-2 border-t border-slate-800 flex justify-between text-[11px] text-slate-400">
                <span>ETA</span>
                <span class="font-mono text-slate-200">On Track</span>
              </div>
            </div>
          </div>

          <div class="mt-6 text-center">
            <p class="text-sm font-medium text-slate-300">ngx-graph Interactive Topology Module</p>
            <p class="text-xs text-slate-500 mt-1 max-w-md">
              Visualizing complete multi-leg shipment chains with dynamic edge weights, real-time weather disruption overlays, and automated route recommendations.
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ControlTowerComponent {}
