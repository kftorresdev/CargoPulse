import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

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
            <h1 class="text-2xl font-bold text-slate-100 tracking-tight">Shipment Tracking & 3-Level Notes</h1>
          </div>
          <p class="mt-1 text-sm text-slate-400">
            End-to-end shipment lifecycle tracing with hierarchical notes structured across Master Bill, House Bill, and SKU Cargo Item.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            class="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-900/30">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            New Booking
          </button>
        </div>
      </div>

      <!-- Quick Metrics -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div class="text-xs text-slate-400">Total Active Shipments</div>
          <div class="mt-2 text-2xl font-bold text-slate-100">1,849</div>
          <div class="mt-1 text-xs text-emerald-400">✓ 94% Green Channel</div>
        </div>

        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div class="text-xs text-slate-400">Ocean Containers (FCL/LCL)</div>
          <div class="mt-2 text-2xl font-bold text-blue-400">1,230</div>
          <div class="mt-1 text-xs text-slate-500">68% of active volume</div>
        </div>

        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div class="text-xs text-slate-400">Air Express AWB</div>
          <div class="mt-2 text-2xl font-bold text-purple-400">412</div>
          <div class="mt-1 text-xs text-slate-500">Priority expedited cargo</div>
        </div>

        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div class="text-xs text-slate-400">Intermodal Rail Cars</div>
          <div class="mt-2 text-2xl font-bold text-amber-400">207</div>
          <div class="mt-1 text-xs text-slate-500">Inland network connections</div>
        </div>
      </div>

      <!-- 3-Level Notes Architecture Preview -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 class="text-base font-semibold text-slate-200">Hierarchical 3-Level Operational Notes System</h2>
            <p class="text-xs text-slate-400 mt-0.5">Granular audit logging and communications across freight levels.</p>
          </div>
          <span class="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Preview Model
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Level 1 -->
          <div class="bg-slate-950/70 border border-blue-500/30 rounded-xl p-4 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-mono font-bold text-blue-400">LEVEL 1: MASTER B/L</span>
              <span class="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">Carrier Tier</span>
            </div>
            <p class="text-xs text-slate-300 font-medium">Ocean Vessel / Flight Master Level</p>
            <p class="text-xs text-slate-400">
              Broad maritime or airway instructions, terminal demurrage alerts, carrier change notices, and port congestion notes.
            </p>
          </div>

          <!-- Level 2 -->
          <div class="bg-slate-950/70 border border-purple-500/30 rounded-xl p-4 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-mono font-bold text-purple-400">LEVEL 2: HOUSE B/L</span>
              <span class="text-[10px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded">Forwarder Tier</span>
            </div>
            <p class="text-xs text-slate-300 font-medium">Consignee & Shipper Directives</p>
            <p class="text-xs text-slate-400">
              Customs broker dispatch, bonded warehouse release, delivery appointments, and phytosanitary certificate approvals.
            </p>
          </div>

          <!-- Level 3 -->
          <div class="bg-slate-950/70 border border-emerald-500/30 rounded-xl p-4 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-mono font-bold text-emerald-400">LEVEL 3: SKU ITEM</span>
              <span class="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">Cargo Tier</span>
            </div>
            <p class="text-xs text-slate-300 font-medium">Individual Pallet & Unit Telemetry</p>
            <p class="text-xs text-slate-400">
              Hazardous materials (HAZMAT) classification, IoT temperature/shock sensor readings, batch barcodes, and serial tracking.
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ShipmentsComponent {}
