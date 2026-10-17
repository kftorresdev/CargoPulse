import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  NgxGraphModule,
  Node,
  Edge,
  Graph,
  DagreLayout,
  Orientation
} from '@swimlane/ngx-graph';
import * as dagreModule from 'dagre';
import { ControlTowerService } from './services/control-tower.service';
import {
  TopologyNode,
  TopologyLink,
  ShipmentSummary,
  ControlTowerKpis,
  TopologyData
} from './models/topology.model';
import { LanguageService } from '@core/services/language.service';

/**
 * Resilient Dagre layout adapter ensuring compatibility across ESM/CJS runtime bundles
 * (specifically resolving dagre.layout vs dagre.default.layout interop).
 */
export class CrossBorderDagreLayout extends DagreLayout {
  override defaultSettings = {
    orientation: Orientation.LEFT_TO_RIGHT,
    marginX: 30,
    marginY: 30,
    edgePadding: 60,
    rankPadding: 100,
    nodePadding: 45,
    curveDistance: 20,
    multigraph: true,
    compound: true
  };

  override createDagreGraph(graph: Graph): any {
    const dagreApi: any = (dagreModule as any).default || dagreModule;
    const settings = Object.assign({}, this.defaultSettings, this.settings);
    this.dagreGraph = new dagreApi.graphlib.Graph({
      compound: settings.compound,
      multigraph: settings.multigraph
    });

    this.dagreGraph.setGraph({
      rankdir: settings.orientation,
      marginx: settings.marginX,
      marginy: settings.marginY,
      edgesep: settings.edgePadding,
      ranksep: settings.rankPadding,
      nodesep: settings.nodePadding,
      multigraph: settings.multigraph,
      compound: settings.compound
    });

    this.dagreGraph.setDefaultEdgeLabel(() => ({}));

    this.dagreNodes = graph.nodes.map(n => {
      const node: any = { ...n };
      node.width = n.dimension?.width || 170;
      node.height = n.dimension?.height || 78;
      node.x = n.position?.x || 0;
      node.y = n.position?.y || 0;
      return node;
    });

    this.dagreEdges = graph.edges.map(l => ({ ...l }));

    for (const node of this.dagreNodes) {
      this.dagreGraph.setNode(node.id, node);
    }

    for (const edge of this.dagreEdges) {
      if (settings.multigraph) {
        this.dagreGraph.setEdge(edge.source, edge.target, edge, edge.id);
      } else {
        this.dagreGraph.setEdge(edge.source, edge.target);
      }
    }

    return this.dagreGraph;
  }

  override run(graph: Graph): Graph {
    this.createDagreGraph(graph);
    const dagreApi: any = (dagreModule as any).default || dagreModule;
    dagreApi.layout(this.dagreGraph);
    graph.edgeLabels = this.dagreGraph._edgeLabels;

    for (const dagreNodeId in this.dagreGraph._nodes) {
      const dagreNode = this.dagreGraph._nodes[dagreNodeId];
      const node = graph.nodes.find(n => n.id === dagreNode.id);
      if (node) {
        node.position = {
          x: dagreNode.x,
          y: dagreNode.y
        };
        node.dimension = {
          width: dagreNode.width,
          height: dagreNode.height
        };
      }
    }
    return graph;
  }

  override updateEdge(graph: Graph, edge: Edge): Graph {
    const sourceNode = graph.nodes.find(n => n.id === edge.source);
    const targetNode = graph.nodes.find(n => n.id === edge.target);
    if (!sourceNode?.position || !targetNode?.position) {
      return graph;
    }

    const sWidth = sourceNode.dimension?.width || 170;
    const tWidth = targetNode.dimension?.width || 170;

    edge.points = [
      { x: sourceNode.position.x + sWidth / 2, y: sourceNode.position.y },
      { x: targetNode.position.x - tWidth / 2, y: targetNode.position.y }
    ];
    return graph;
  }
}

@Component({
  selector: 'app-control-tower',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxGraphModule],
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
            <h1 class="text-2xl font-bold text-slate-100 tracking-tight">{{ languageService.t('control_tower.title') }}</h1>
          </div>
          <p class="mt-1 text-sm text-slate-400">
            {{ languageService.t('control_tower.subtitle') }}
          </p>
        </div>

        <div class="flex items-center gap-3">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            {{ languageService.t('control_tower.live_sync') }}
          </span>
          <button
            type="button"
            (click)="refreshTelemetry()"
            class="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-900/30">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {{ languageService.t('control_tower.refresh_telemetry') }}
          </button>
        </div>
      </div>

      <!-- Quick KPI Strip -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div class="flex items-center justify-between text-xs text-slate-400">
            <span>{{ languageService.t('control_tower.kpi.active_nodes') }}</span>
            <span class="text-emerald-400 font-semibold">{{ languageService.t('control_tower.kpi.operational') }}</span>
          </div>
          <div class="mt-2 text-2xl font-bold text-slate-100">{{ kpis().activeNodes }}</div>
          <div class="mt-1 text-xs text-slate-500">{{ languageService.t('control_tower.kpi.active_nodes_sub') }}</div>
        </div>

        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div class="flex items-center justify-between text-xs text-slate-400">
            <span>{{ languageService.t('control_tower.kpi.in_transit') }}</span>
            <span class="text-blue-400 font-semibold">{{ languageService.t('control_tower.kpi.live_transit') }}</span>
          </div>
          <div class="mt-2 text-2xl font-bold text-slate-100">{{ kpis().inTransitShipments }}</div>
          <div class="mt-1 text-xs text-slate-500">{{ languageService.t('control_tower.kpi.in_transit_sub') }}</div>
        </div>

        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div class="flex items-center justify-between text-xs text-slate-400">
            <span>{{ languageService.t('control_tower.kpi.customs_holds') }}</span>
            <span [class.text-amber-400]="kpis().customsHolds > 0" [class.text-emerald-400]="kpis().customsHolds === 0" class="font-semibold">
              {{ kpis().customsHolds > 0 ? languageService.t('control_tower.kpi.action_required') : languageService.t('control_tower.kpi.clear') }}
            </span>
          </div>
          <div class="mt-2 text-2xl font-bold text-amber-400">{{ kpis().customsHolds }}</div>
          <div class="mt-1 text-xs text-slate-500">{{ languageService.t('control_tower.kpi.customs_sub') }}</div>
        </div>

        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div class="flex items-center justify-between text-xs text-slate-400">
            <span>{{ languageService.t('control_tower.kpi.on_time') }}</span>
            <span class="text-emerald-400 font-semibold">{{ languageService.t('control_tower.kpi.sla_target') }}</span>
          </div>
          <div class="mt-2 text-2xl font-bold text-emerald-400">{{ kpis().onTimeRate }}</div>
          <div class="mt-1 text-xs text-slate-500">{{ languageService.t('control_tower.kpi.sla_sub') }}</div>
        </div>
      </div>

      <!-- Main Visual Graph Card -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-800/80 pb-3">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <h2 class="text-base font-semibold text-slate-200">{{ languageService.t('control_tower.graph.title') }}</h2>
          </div>
          <div class="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300">{{ languageService.t('control_tower.graph.pan_zoom') }}</span>
            <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300">{{ languageService.t('control_tower.graph.lr_hierarchy') }}</span>
            @if (selectedNode() || selectedLink()) {
              <button
                type="button"
                (click)="clearFilter()"
                class="px-2.5 py-0.5 rounded bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/40 transition-colors">
                {{ languageService.t('control_tower.graph.clear_selection') }}
              </button>
            }
          </div>
        </div>

        <!-- Legend -->
        <div class="flex flex-wrap items-center gap-4 text-xs text-slate-400 mb-3 px-2">
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-blue-500 border border-blue-300"></span>
            <span>{{ languageService.t('control_tower.node_type.origin') }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded bg-amber-500 border border-amber-300"></span>
            <span>{{ languageService.t('control_tower.node_type.customs_border') }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rotate-45 bg-emerald-500 border border-emerald-300"></span>
            <span>{{ languageService.t('control_tower.node_type.destination_normal') }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rotate-45 bg-red-500 border border-red-300"></span>
            <span>{{ languageService.t('control_tower.node_type.destination_delayed') }}</span>
          </div>
          <span class="text-slate-600">|</span>
          <span class="text-slate-500">{{ languageService.t('control_tower.graph.legend_hint') }}</span>
        </div>

        <!-- Graph Container -->
        <div class="h-[460px] w-full rounded-xl border border-slate-800/80 bg-slate-950/80 relative overflow-hidden">
          <ngx-graph
            class="w-full h-full"
            [nodes]="nodes()"
            [links]="links()"
            [layout]="customLayout"
            [layoutSettings]="layoutSettings"
            [autoZoom]="true"
            [autoCenter]="true"
            [enableZoom]="true"
            [panOnZoom]="true"
            (select)="onGraphSelect($event)">

            <!-- Custom SVG Defs for Glow Filters and Markers -->
            <ng-template #defsTemplate>
              <svg:defs>
                <!-- Glow Filters -->
                <svg:filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
                  <svg:feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <svg:feMerge>
                    <svg:feMergeNode in="coloredBlur"/>
                    <svg:feMergeNode in="SourceGraphic"/>
                  </svg:feMerge>
                </svg:filter>

                <svg:filter id="glow-amber" x="-50%" y="-50%" width="200%" height="200%">
                  <svg:feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <svg:feMerge>
                    <svg:feMergeNode in="coloredBlur"/>
                    <svg:feMergeNode in="SourceGraphic"/>
                  </svg:feMerge>
                </svg:filter>

                <svg:filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
                  <svg:feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <svg:feMerge>
                    <svg:feMergeNode in="coloredBlur"/>
                    <svg:feMergeNode in="SourceGraphic"/>
                  </svg:feMerge>
                </svg:filter>

                <svg:filter id="glow-emerald" x="-50%" y="-50%" width="200%" height="200%">
                  <svg:feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <svg:feMerge>
                    <svg:feMergeNode in="coloredBlur"/>
                    <svg:feMergeNode in="SourceGraphic"/>
                  </svg:feMerge>
                </svg:filter>

                <!-- Arrowhead Markers -->
                <svg:marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse">
                  <svg:path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b"/>
                </svg:marker>

                <svg:marker
                  id="arrow-selected"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse">
                  <svg:path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8"/>
                </svg:marker>
              </svg:defs>
            </ng-template>

            <!-- Custom SVG Node Template -->
            <ng-template #nodeTemplate let-node>
              <svg:g
                class="node cursor-pointer transition-all duration-200"
                (click)="onSelectNode(node.data)">

                <!-- Selection Halo -->
                @if (selectedNode()?.id === node.id) {
                  <svg:rect
                    x="2"
                    y="2"
                    [attr.width]="node.dimension.width - 4"
                    [attr.height]="node.dimension.height - 4"
                    rx="12"
                    fill="none"
                    stroke="#38bdf8"
                    stroke-width="2.5"
                    stroke-dasharray="5,3"
                    class="animate-pulse"
                  />
                }

                <!-- ORIGIN NODE: Blue circle with glowing border -->
                @if (node.data.type === 'ORIGIN') {
                  <svg:g>
                    <!-- Background card base -->
                    <svg:rect
                      x="4"
                      y="4"
                      [attr.width]="node.dimension.width - 8"
                      [attr.height]="node.dimension.height - 8"
                      rx="10"
                      fill="#0b1329"
                      fill-opacity="0.9"
                      stroke="#1e293b"
                      stroke-width="1"
                    />

                    <!-- Glowing Blue Circle Avatar -->
                    <svg:circle
                      cx="36"
                      cy="38"
                      r="22"
                      fill="#0f172a"
                      stroke="#3b82f6"
                      stroke-width="3"
                      filter="url(#glow-blue)"
                    />
                    <!-- Inner core circle -->
                    <svg:circle
                      cx="36"
                      cy="38"
                      r="10"
                      fill="#1d4ed8"
                      fill-opacity="0.6"
                      stroke="#60a5fa"
                      stroke-width="1.5"
                    />

                    <!-- Node active shipment count badge -->
                    <svg:g transform="translate(48, 20)">
                      <svg:circle r="8.5" fill="#2563eb" stroke="#bfdbfe" stroke-width="1.5" />
                      <svg:text text-anchor="middle" y="3" class="fill-white text-[9px] font-bold select-none pointer-events-none">
                        {{ node.data.activeShipmentsCount }}
                      </svg:text>
                    </svg:g>

                    <!-- Text details -->
                    <svg:text
                      x="68"
                      y="32"
                      class="fill-slate-100 font-bold text-[11px] select-none pointer-events-none">
                      {{ node.data.label }}
                    </svg:text>
                    <svg:text
                      x="68"
                      y="46"
                      class="fill-blue-400 text-[9px] font-mono select-none pointer-events-none">
                      ORIGIN • {{ node.data.status }}
                    </svg:text>
                    <svg:text
                      x="68"
                      y="58"
                      class="fill-slate-400 text-[8.5px] select-none pointer-events-none">
                      {{ node.data.location }}
                    </svg:text>
                  </svg:g>
                }

                <!-- CUSTOMS_BORDER NODE: Dark rounded box with amber/red border -->
                @if (node.data.type === 'CUSTOMS_BORDER') {
                  <svg:g>
                    <!-- Dark rounded box -->
                    <svg:rect
                      x="4"
                      y="4"
                      [attr.width]="node.dimension.width - 8"
                      [attr.height]="node.dimension.height - 8"
                      rx="10"
                      fill="#0d1117"
                      fill-opacity="0.95"
                      [attr.stroke]="node.data.status === 'CONGESTED' ? '#ef4444' : '#f59e0b'"
                      stroke-width="2.5"
                      [attr.filter]="node.data.status === 'CONGESTED' ? 'url(#glow-red)' : 'url(#glow-amber)'"
                    />

                    <!-- Left Accent Border Strip -->
                    <svg:rect
                      x="4"
                      y="4"
                      width="6"
                      [attr.height]="node.dimension.height - 8"
                      rx="3"
                      [attr.fill]="node.data.status === 'CONGESTED' ? '#ef4444' : '#f59e0b'"
                    />

                    <!-- Node active shipment count badge -->
                    <svg:g [attr.transform]="'translate(' + (node.dimension.width - 16) + ', 14)'">
                      <svg:circle
                        r="8.5"
                        [attr.fill]="node.data.status === 'CONGESTED' ? '#dc2626' : '#d97706'"
                        stroke="#fef08a"
                        stroke-width="1.5"
                      />
                      <svg:text text-anchor="middle" y="3" class="fill-white text-[9px] font-bold select-none pointer-events-none">
                        {{ node.data.activeShipmentsCount }}
                      </svg:text>
                    </svg:g>

                    <!-- Text details -->
                    <svg:text
                      x="18"
                      y="26"
                      [attr.fill]="node.data.status === 'CONGESTED' ? '#f87171' : '#fbbf24'"
                      class="text-[9px] font-mono font-bold uppercase select-none pointer-events-none">
                      CUSTOMS BORDER
                    </svg:text>
                    <svg:text
                      x="18"
                      y="42"
                      class="fill-slate-100 font-bold text-[11px] select-none pointer-events-none">
                      {{ node.data.label }}
                    </svg:text>
                    <svg:text
                      x="18"
                      y="56"
                      class="fill-slate-400 text-[8.5px] select-none pointer-events-none">
                      {{ node.data.location }}
                    </svg:text>
                  </svg:g>
                }

                <!-- DESTINATION NODE: Red/Emerald geometric triangle or hexagon -->
                @if (node.data.type === 'DESTINATION') {
                  <svg:g>
                    <!-- Background card base -->
                    <svg:rect
                      x="4"
                      y="4"
                      [attr.width]="node.dimension.width - 8"
                      [attr.height]="node.dimension.height - 8"
                      rx="10"
                      fill="#0a121d"
                      fill-opacity="0.9"
                      stroke="#1e293b"
                      stroke-width="1"
                    />

                    <!-- Geometric Hexagon Badge on left -->
                    <svg:polygon
                      points="36,18 50,28 50,48 36,58 22,48 22,28"
                      fill="#0f172a"
                      [attr.stroke]="node.data.status === 'DELAYED' ? '#ef4444' : '#10b981'"
                      stroke-width="2.5"
                      [attr.filter]="node.data.status === 'DELAYED' ? 'url(#glow-red)' : 'url(#glow-emerald)'"
                    />

                    <!-- Destination Icon Inside Hexagon -->
                    <svg:circle
                      cx="36"
                      cy="38"
                      r="4"
                      [attr.fill]="node.data.status === 'DELAYED' ? '#ef4444' : '#10b981'"
                    />

                    <!-- Node active shipment count badge -->
                    <svg:g transform="translate(48, 20)">
                      <svg:circle
                        r="8.5"
                        [attr.fill]="node.data.status === 'DELAYED' ? '#dc2626' : '#059669'"
                        stroke="#a7f3d0"
                        stroke-width="1.5"
                      />
                      <svg:text text-anchor="middle" y="3" class="fill-white text-[9px] font-bold select-none pointer-events-none">
                        {{ node.data.activeShipmentsCount }}
                      </svg:text>
                    </svg:g>

                    <!-- Text details -->
                    <svg:text
                      x="64"
                      y="32"
                      class="fill-slate-100 font-bold text-[11px] select-none pointer-events-none">
                      {{ node.data.label }}
                    </svg:text>
                    <svg:text
                      x="64"
                      y="46"
                      [attr.fill]="node.data.status === 'DELAYED' ? '#f87171' : '#34d399'"
                      class="text-[9px] font-mono select-none pointer-events-none">
                      DESTINATION • {{ node.data.status }}
                    </svg:text>
                    <svg:text
                      x="64"
                      y="58"
                      class="fill-slate-400 text-[8.5px] select-none pointer-events-none">
                      {{ node.data.location }}
                    </svg:text>
                  </svg:g>
                }
              </svg:g>
            </ng-template>

            <!-- Custom SVG Link / Edge Template -->
            <ng-template #linkTemplate let-link>
              <svg:g class="edge cursor-pointer" (click)="onSelectLink(link.data)">
                <!-- Base Path -->
                <svg:path
                  class="line transition-colors duration-200"
                  [attr.d]="link.line"
                  [attr.stroke]="selectedLink()?.id === link.id ? '#38bdf8' : getLinkColor(link.data?.mode)"
                  [attr.stroke-width]="selectedLink()?.id === link.id ? 3.5 : 2"
                  [attr.stroke-dasharray]="link.data?.mode === 'RAIL' ? '6,4' : link.data?.mode === 'AIR' ? '3,3' : 'none'"
                  [attr.marker-end]="selectedLink()?.id === link.id ? 'url(#arrow-selected)' : 'url(#arrow)'"
                />

                <!-- Transparent hit target path for easy clicking -->
                <svg:path
                  [attr.d]="link.line"
                  stroke="transparent"
                  stroke-width="16"
                  fill="none"
                  class="cursor-pointer"
                />

                <!-- Midpoint transit mode pill -->
                @if (link.midPoint) {
                  <svg:g [attr.transform]="'translate(' + link.midPoint.x + ',' + link.midPoint.y + ')'" class="cursor-pointer">
                    <svg:rect
                      x="-36"
                      y="-10"
                      width="72"
                      height="20"
                      rx="10"
                      [attr.fill]="selectedLink()?.id === link.id ? '#0284c7' : '#0f172a'"
                      [attr.stroke]="selectedLink()?.id === link.id ? '#38bdf8' : '#334155'"
                      stroke-width="1.5"
                    />
                    <svg:text
                      text-anchor="middle"
                      y="3.5"
                      [attr.fill]="selectedLink()?.id === link.id ? '#ffffff' : '#cbd5e1'"
                      class="text-[9.5px] font-mono font-medium select-none pointer-events-none">
                      {{ link.data?.mode }} • {{ link.data?.transitDays }}d
                    </svg:text>
                  </svg:g>
                }
              </svg:g>
            </ng-template>
          </ngx-graph>
        </div>
      </div>

      <!-- Bottom Reactive Shipments Table -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <!-- Table Header and Filter State -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </span>
            <div>
              <h3 class="text-base font-semibold text-slate-100">{{ languageService.t('control_tower.table.title') }}</h3>
              <p class="text-xs text-slate-400">
                {{ languageService.t('control_tower.table.displaying', { filtered: filteredShipments().length, total: shipments().length }) }}
              </p>
            </div>
          </div>

          <!-- Active Filter Pill & Clear Button -->
          <div class="flex flex-wrap items-center gap-2">
            @if (selectedNode(); as node) {
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/30">
                <span class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span>
                {{ languageService.t('control_tower.table.node_filter', { label: node.label, type: getNodeTypeLabel(node.type) }) }}
              </span>
            } @else if (selectedLink(); as link) {
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                {{ languageService.t('control_tower.table.corridor_filter', { label: link.label, mode: link.mode }) }}
              </span>
            } @else {
              <span class="px-2.5 py-1 text-xs text-slate-400 rounded-md bg-slate-800/60 border border-slate-700/50">
                {{ languageService.t('control_tower.table.all_corridors') }}
              </span>
            }

            @if (selectedNode() || selectedLink()) {
              <button
                type="button"
                (click)="clearFilter()"
                class="clear-filter-btn px-3 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 shadow-sm">
                <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
                {{ languageService.t('control_tower.table.clear_filter') }}
              </button>
            }
          </div>
        </div>

        <!-- Table Grid -->
        <div class="overflow-x-auto rounded-xl border border-slate-800">
          <table class="w-full text-left text-sm text-slate-300">
            <thead class="text-xs uppercase bg-slate-800/60 text-slate-400 border-b border-slate-800 font-mono">
              <tr>
                <th class="py-3 px-4">{{ languageService.t('control_tower.table.tracking_num') }}</th>
                <th class="py-3 px-4">{{ languageService.t('control_tower.table.origin_destination') }}</th>
                <th class="py-3 px-4">{{ languageService.t('control_tower.table.carrier') }}</th>
                <th class="py-3 px-4">{{ languageService.t('control_tower.table.current_stage') }}</th>
                <th class="py-3 px-4">{{ languageService.t('control_tower.table.eta') }}</th>
                <th class="py-3 px-4">{{ languageService.t('control_tower.table.status') }}</th>
                <th class="py-3 px-4">{{ languageService.t('control_tower.table.delay_risk') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800 bg-slate-900/40">
              @for (shipment of filteredShipments(); track shipment.id) {
                <tr class="hover:bg-slate-800/50 transition-colors">
                  <td class="py-3.5 px-4 font-mono font-medium text-blue-400">
                    {{ shipment.trackingNumber }}
                  </td>
                  <td class="py-3.5 px-4">
                    <span class="font-medium text-slate-200">{{ shipment.origin }}</span>
                    <span class="text-slate-500 mx-1.5">&rarr;</span>
                    <span class="font-medium text-slate-200">{{ shipment.destination }}</span>
                  </td>
                  <td class="py-3.5 px-4 text-slate-300 font-medium">
                    {{ shipment.carrierName }}
                  </td>
                  <td class="py-3.5 px-4">
                    <span class="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700">
                      {{ shipment.currentStage }}
                    </span>
                  </td>
                  <td class="py-3.5 px-4 font-mono text-xs text-slate-400">
                    {{ shipment.eta }}
                  </td>
                  <td class="py-3.5 px-4">
                    <span
                      [ngClass]="getStatusBadgeClass(shipment.status)"
                      class="px-2.5 py-1 rounded-full text-xs font-semibold">
                      {{ formatStatus(shipment.status) }}
                    </span>
                  </td>
                  <td class="py-3.5 px-4">
                    <span
                      [ngClass]="getRiskBadgeClass(shipment.delayRisk)"
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium">
                      <span class="w-1.5 h-1.5 rounded-full" [ngClass]="getRiskDotClass(shipment.delayRisk)"></span>
                      {{ shipment.delayRisk }} {{ languageService.t('control_tower.risk') }}
                    </span>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="py-10 text-center text-slate-400">
                    <div class="flex flex-col items-center justify-center gap-2">
                      <svg class="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9" stroke-width="2"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6"/>
                      </svg>
                      <p class="text-sm font-medium text-slate-300">{{ languageService.t('control_tower.table.no_shipments') }}</p>
                      <button
                        (click)="clearFilter()"
                        class="text-xs text-blue-400 hover:text-blue-300 underline font-semibold mt-1">
                        {{ languageService.t('control_tower.table.clear_filter_to_show_all') }}
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class ControlTowerComponent implements OnInit {
  private readonly controlTowerService = inject(ControlTowerService);
  readonly languageService = inject(LanguageService);

  readonly customLayout = new CrossBorderDagreLayout();

  readonly nodes = signal<Node[]>([]);
  readonly links = signal<Edge[]>([]);
  readonly selectedNode = signal<TopologyNode | null>(null);
  readonly selectedLink = signal<TopologyLink | null>(null);
  readonly shipments = signal<ShipmentSummary[]>([]);

  getNodeTypeLabel(type: string): string {
    switch (type) {
      case 'ORIGIN':
        return this.languageService.t('control_tower.node_type.origin');
      case 'CUSTOMS_BORDER':
        return this.languageService.t('control_tower.node_type.customs_border');
      case 'DESTINATION':
        return this.languageService.t('control_tower.node_type.destination_normal').replace(/ \(.+\)/, '');
      default:
        return type;
    }
  }

  readonly layoutSettings = {
    orientation: 'LR',
    marginX: 30,
    marginY: 30,
    edgePadding: 60,
    rankPadding: 100,
    nodePadding: 45
  };

  readonly kpis = computed<ControlTowerKpis>(() => {
    const list = this.shipments();
    const nodeList = this.nodes();
    const inTransit = list.filter(
      s => s.status === 'IN_TRANSIT' || s.status === 'OUT_FOR_DELIVERY'
    ).length;
    const customsHolds = list.filter(s => s.status === 'CUSTOMS_HOLD').length;
    const onTimeCount = list.filter(s => s.delayRisk !== 'HIGH').length;
    const onTimeRate =
      list.length > 0 ? `${((onTimeCount / list.length) * 100).toFixed(1)}%` : '100.0%';

    return {
      activeNodes: nodeList.length,
      inTransitShipments: inTransit,
      customsHolds,
      onTimeRate
    };
  });

  readonly filteredShipments = computed<ShipmentSummary[]>(() => {
    const node = this.selectedNode();
    const link = this.selectedLink();
    const all = this.shipments();

    if (node) {
      return all.filter(s =>
        s.origin === node.label ||
        s.destination === node.label ||
        s.currentStage === node.label ||
        s.origin === node.id ||
        s.destination === node.id ||
        s.currentStage === node.id ||
        s.routeNodeIds?.includes(node.id)
      );
    }

    if (link) {
      return all.filter(s =>
        s.routeLinkIds?.includes(link.id) ||
        (s.origin === link.source && s.destination === link.target) ||
        s.currentStage === link.label
      );
    }

    return all;
  });

  constructor() {
    // Seed initial state with deterministic demo data immediately
    const demo = this.controlTowerService.getDemoData();
    this.applyTopologyData(demo);
  }

  ngOnInit(): void {
    this.refreshTelemetry();
  }

  refreshTelemetry(): void {
    this.controlTowerService.getTopologyData().subscribe(data => {
      this.applyTopologyData(data);
    });
  }

  private applyTopologyData(data: TopologyData): void {
    this.shipments.set(data.shipments);

    const mappedNodes: Node[] = data.nodes.map(n => ({
      id: n.id,
      label: n.label,
      dimension: { width: 170, height: 78 },
      data: n
    }));
    this.nodes.set(mappedNodes);

    const mappedLinks: Edge[] = data.links.map(l => ({
      id: l.id,
      source: l.source,
      target: l.target,
      label: l.label,
      data: l
    }));
    this.links.set(mappedLinks);
  }

  onSelectNode(nodeOrData: TopologyNode | Node | null): void {
    if (!nodeOrData) return;
    const node: TopologyNode = (nodeOrData as any).data ? (nodeOrData as any).data : nodeOrData;
    this.selectedLink.set(null);
    this.selectedNode.set(node);
  }

  onSelectLink(linkOrData: TopologyLink | Edge | null): void {
    if (!linkOrData) return;
    const link: TopologyLink = (linkOrData as any).data ? (linkOrData as any).data : linkOrData;
    this.selectedNode.set(null);
    this.selectedLink.set(link);
  }

  onGraphSelect(event: any): void {
    if (!event) return;
    if (event.source && event.target) {
      this.onSelectLink(event);
    } else {
      this.onSelectNode(event);
    }
  }

  clearFilter(): void {
    this.selectedNode.set(null);
    this.selectedLink.set(null);
  }

  getLinkColor(mode?: string): string {
    switch (mode) {
      case 'ROAD':
        return '#64748b';
      case 'RAIL':
        return '#8b5cf6';
      case 'OCEAN':
        return '#0284c7';
      case 'AIR':
        return '#06b6d4';
      default:
        return '#64748b';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'IN_TRANSIT':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'CUSTOMS_HOLD':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'OUT_FOR_DELIVERY':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'DELIVERED':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      default:
        return 'bg-slate-700/30 text-slate-300 border border-slate-700';
    }
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ');
  }

  getRiskBadgeClass(risk: 'LOW' | 'MEDIUM' | 'HIGH'): string {
    switch (risk) {
      case 'LOW':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'HIGH':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
    }
  }

  getRiskDotClass(risk: 'LOW' | 'MEDIUM' | 'HIGH'): string {
    switch (risk) {
      case 'LOW':
        return 'bg-emerald-400';
      case 'MEDIUM':
        return 'bg-amber-400';
      case 'HIGH':
        return 'bg-red-400';
    }
  }
}
