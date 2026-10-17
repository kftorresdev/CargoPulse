import { Injectable, signal } from '@angular/core';

export type SupportedLanguage = 'es' | 'en';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private readonly STORAGE_KEY = 'cargopulse_lang';

  /**
   * Governed by Angular Signal. Defaults to 'es'.
   * Safely checks localStorage if available.
   */
  readonly currentLang = signal<SupportedLanguage>(this.getInitialLanguage());

  private readonly translations: Record<SupportedLanguage, Record<string, string>> = {
    es: {
      // Brand & Navbar
      'navbar.brand': 'CargoPulse',
      'navbar.subtitle': 'Torre de Control',
      'navbar.status_connected': 'Conectado',
      'navbar.status_tooltip': 'Estado del flujo de telemetría: Conectado',
      'navbar.sign_out': 'Cerrar Sesión',
      'roles.admin': 'Admin',
      'roles.operator': 'Operador',
      'roles.auditor': 'Auditor',
      'roles.guest': 'Invitado',

      // Sidebar
      'sidebar.command_hub': 'Centro de Mando',
      'sidebar.control_tower': 'Torre de Control',
      'sidebar.freight_audit': 'Auditoría de Fletes',
      'sidebar.alert_center': 'Centro de Alertas',
      'sidebar.shipments': 'Envíos',
      'sidebar.collapse': 'Colapsar Menú',
      'sidebar.expand': 'Expandir Menú',

      // Control Tower
      'control_tower.title': 'Torre de Control y DAG de Topología',
      'control_tower.subtitle':
        'Topología multimodal transfronteriza en tiempo real, telemetría de nodos de cadena de suministro y grafo de enrutamiento automatizado.',
      'control_tower.live_sync': 'Sincronización en Vivo DAG Activa',
      'control_tower.refresh_telemetry': 'Actualizar Telemetría',
      'control_tower.kpi.active_nodes': 'Nodos DAG Activos',
      'control_tower.kpi.operational': '100% Operativo',
      'control_tower.kpi.active_nodes_sub': 'Centros Transfronterizos y Aduanas',
      'control_tower.kpi.in_transit': 'Envíos en Tránsito',
      'control_tower.kpi.live_transit': 'Tránsito en Vivo',
      'control_tower.kpi.in_transit_sub': 'Carretero, Ferroviario y Marítimo Multimodal',
      'control_tower.kpi.customs_holds': 'Retenciones Aduanales',
      'control_tower.kpi.action_required': 'Acción Requerida',
      'control_tower.kpi.clear': 'Despejado',
      'control_tower.kpi.customs_sub': 'Inspecciones y Despacho Fronterizo',
      'control_tower.kpi.on_time': 'Llegadas a Tiempo (OTA)',
      'control_tower.kpi.sla_target': 'Meta SLA ≥ 95%',
      'control_tower.kpi.sla_sub': 'Cumplimiento Predicho de SLA',
      'control_tower.graph.title': 'Grafo Acíclico Dirigido Interactivo (DAG)',
      'control_tower.graph.pan_zoom': 'Paneo y Zoom Habilitado',
      'control_tower.graph.lr_hierarchy': 'Jerarquía Izquierda a Derecha',
      'control_tower.graph.clear_selection': 'Limpiar Selección',
      'control_tower.node_type.origin': 'Origen',
      'control_tower.node_type.customs_border': 'Aduana / Frontera',
      'control_tower.node_type.destination_normal': 'Destino (Normal)',
      'control_tower.node_type.destination_delayed': 'Destino (Retrasado)',
      'control_tower.graph.legend_hint': 'Haga clic en cualquier nodo o corredor para filtrar envíos',
      'control_tower.table.title': 'Telemetría Reactiva de Envíos',
      'control_tower.table.displaying': 'Mostrando {filtered} de {total} envíos transfronterizos multimodales',
      'control_tower.table.node_filter': 'Nodo: {label} ({type})',
      'control_tower.table.corridor_filter': 'Corredor: {label} ({mode})',
      'control_tower.table.all_corridors': 'Todos los Corredores Activos',
      'control_tower.table.clear_filter': 'Limpiar Filtro',
      'control_tower.table.view_all_shipments': 'Ver todos los envíos',
      'control_tower.table.tracking_num': 'No. de Rastreo',
      'control_tower.table.origin_destination': 'Origen → Destino',
      'control_tower.table.carrier': 'Transportista',
      'control_tower.table.current_stage': 'Etapa Actual',
      'control_tower.table.eta': 'ETA',
      'control_tower.table.status': 'Estatus',
      'control_tower.table.delay_risk': 'Riesgo de Retraso',
      'control_tower.table.no_shipments': 'No se encontraron envíos para el filtro activo',
      'control_tower.table.clear_filter_to_show_all': 'Limpiar filtro para ver todos los envíos',
      'control_tower.risk': 'RIESGO',

      // Freight Audit
      'freight_audit.title': 'Motor de Auditoría de Fletes de 5 Tramos',
      'freight_audit.subtitle':
        'Conciliación automatizada de facturas multi-tramo, validación de tarifas, detección de demoras y auditoría de variaciones.',
      'freight_audit.export_excel': 'Exportar a Excel (.xlsx)',
      'freight_audit.exporting': 'Exportando Matriz...',
      'freight_audit.kpi.total_contracted': 'Total Cotizado',
      'freight_audit.kpi.target_baseline': 'Línea Base',
      'freight_audit.kpi.agreed_tariffs': 'Tarifas acordadas por contrato',
      'freight_audit.kpi.total_actual': 'Total Facturado',
      'freight_audit.kpi.invoiced': 'Facturado',
      'freight_audit.kpi.carrier_invoice_total': 'Total facturado por transportistas',
      'freight_audit.kpi.net_variance': 'Desviación Neta',
      'freight_audit.kpi.balanced': 'Balanceado según contratos acordados',
      'freight_audit.kpi.cost_overrun': 'Sobrecosto detectado',
      'freight_audit.kpi.savings': 'Ahorro por volumen asegurado',
      'freight_audit.kpi.disputed_stages': 'Tramos en Disputa',
      'freight_audit.kpi.dispute_active': 'Disputa Activa',
      'freight_audit.kpi.all_clear': 'Sin Disputas',
      'freight_audit.kpi.requires_justification': 'Requiere justificación / crédito del auditor',
      'freight_audit.kpi.zero_anomalies': 'Cero anomalías arancelarias detectadas',
      'freight_audit.kpi.legs': 'tramos',
      'freight_audit.selector.title': 'Seleccionar Objetivo de Auditoría de Envío',
      'freight_audit.selector.subtitle':
        'Revisar desglose de 5 tramos: arrastre, marítimo/aéreo, aduana, ferrocarril y última milla.',
      'freight_audit.selector.active': 'Activo',
      'freight_audit.matrix.title': 'Matriz de Conciliación de 5 Tramos',
      'freight_audit.matrix.subtitle':
        'Comparación detallada de tarifas contratadas vs importes facturados con detección cromática de varianza.',
      'freight_audit.matrix.policy': 'POLÍTICA-AUDITORÍA-2026',
      'freight_audit.matrix.leg': 'Tramo',
      'freight_audit.table.num': '#',
      'freight_audit.table.stage_name': 'Tramo',
      'freight_audit.table.contracted': 'Cotizado ($)',
      'freight_audit.table.actual': 'Real ($)',
      'freight_audit.table.variance': 'Desviación ($)',
      'freight_audit.table.variance_pct': 'Varianza (%)',
      'freight_audit.table.status': 'Estatus',
      'freight_audit.table.audit_notes': 'Notas de Auditoría',
      'freight_audit.table.actions': 'Acciones',
      'freight_audit.table.edit_audit': 'Editar / Auditar',
      'freight_audit.table.no_notes': 'Sin notas registradas.',
      'freight_audit.stage.origin_handling': 'Arrastre de Origen',
      'freight_audit.stage.transit_1': 'Tránsito Internacional 1',
      'freight_audit.stage.customs_border': 'Despacho Aduanal y Cruce Fronterizo',
      'freight_audit.stage.transit_2': 'Tránsito Internacional 2',
      'freight_audit.stage.final_destination': 'Entrega de Última Milla',
      'freight_audit.modal.title': 'Ajuste de Auditoría',
      'freight_audit.modal.leg_info': 'Tramo {leg}: {stage} ({shipment})',
      'freight_audit.modal.close': 'Cerrar modal',
      'freight_audit.modal.baseline_tariff': 'Tarifa Base Contratada',
      'freight_audit.modal.msa_agreed_rate': 'Tarifa acordada en Acuerdo Maestro de Servicios',
      'freight_audit.modal.actual_cost': 'Costo Real Incurrido ($ USD)',
      'freight_audit.modal.actual_cost_error': 'El costo real debe ser un número positivo.',
      'freight_audit.modal.live_variance_preview': 'Vista Previa de Desviación en Vivo',
      'freight_audit.modal.calculated_variance': 'Desviación Calculada',
      'freight_audit.modal.auto_status_detection': 'Detección Automática de Estatus',
      'freight_audit.modal.status_override': 'Anulación de Estatus de Auditoría',
      'freight_audit.modal.status_approved': 'APROBADO (Dentro de tolerancia / Verificado)',
      'freight_audit.modal.status_disputed': 'EN DISPUTA (Marcado para nota de crédito/reembolso)',
      'freight_audit.modal.status_pending': 'PENDIENTE (En espera de documentos de soporte)',
      'freight_audit.modal.rule_note':
        'Regla: Se marca automáticamente como EN DISPUTA cuando la desviación supera el +5%.',
      'freight_audit.modal.audit_notes': 'Notas de Auditoría y Justificación de Discrepancia',
      'freight_audit.modal.notes_placeholder':
        'Ingrese el motivo de la discrepancia de factura, referencia arancelaria o seguimiento de disputa...',
      'freight_audit.modal.cancel': 'Cancelar',
      'freight_audit.modal.save': 'Guardar Ajuste de Auditoría',
      'freight_audit.modal.saving': 'Guardando...',
    },
    en: {
      // Brand & Navbar
      'navbar.brand': 'CargoPulse',
      'navbar.subtitle': 'Control Tower',
      'navbar.status_connected': 'Connected',
      'navbar.status_tooltip': 'Telemetry stream status: Connected',
      'navbar.sign_out': 'Sign Out',
      'roles.admin': 'Admin',
      'roles.operator': 'Operator',
      'roles.auditor': 'Auditor',
      'roles.guest': 'Guest',

      // Sidebar
      'sidebar.command_hub': 'Command Hub',
      'sidebar.control_tower': 'Control Tower',
      'sidebar.freight_audit': 'Freight Audit',
      'sidebar.alert_center': 'Alert Center',
      'sidebar.shipments': 'Shipments',
      'sidebar.collapse': 'Collapse Sidebar',
      'sidebar.expand': 'Expand Sidebar',

      // Control Tower
      'control_tower.title': 'Control Tower & Topology DAG',
      'control_tower.subtitle':
        'Real-time cross-border multi-modal topology, supply chain node telemetry, and automated routing graph.',
      'control_tower.live_sync': 'DAG Live Sync Active',
      'control_tower.refresh_telemetry': 'Refresh Telemetry',
      'control_tower.kpi.active_nodes': 'Active DAG Nodes',
      'control_tower.kpi.operational': '100% Operational',
      'control_tower.kpi.active_nodes_sub': 'Cross-Border Hubs & Border Gates',
      'control_tower.kpi.in_transit': 'In-Transit Shipments',
      'control_tower.kpi.live_transit': 'Live Transit',
      'control_tower.kpi.in_transit_sub': 'Multimodal Road, Rail & Ocean',
      'control_tower.kpi.customs_holds': 'Customs Holds',
      'control_tower.kpi.action_required': 'Action Required',
      'control_tower.kpi.clear': 'Clear',
      'control_tower.kpi.customs_sub': 'Border Inspections & Clearance',
      'control_tower.kpi.on_time': 'On-Time Arrival (OTA)',
      'control_tower.kpi.sla_target': 'SLA Target ≥ 95%',
      'control_tower.kpi.sla_sub': 'Predicted SLA Compliance',
      'control_tower.graph.title': 'Interactive Directed Acyclic Graph (DAG)',
      'control_tower.graph.pan_zoom': 'Pan & Zoom Enabled',
      'control_tower.graph.lr_hierarchy': 'Left-to-Right Hierarchy',
      'control_tower.graph.clear_selection': 'Clear Selection',
      'control_tower.node_type.origin': 'Origin',
      'control_tower.node_type.customs_border': 'Customs / Border',
      'control_tower.node_type.destination_normal': 'Destination (Normal)',
      'control_tower.node_type.destination_delayed': 'Destination (Delayed)',
      'control_tower.graph.legend_hint': 'Click any node or corridor to filter shipments',
      'control_tower.table.title': 'Reactive Shipments Telemetry',
      'control_tower.table.displaying':
        'Displaying {filtered} of {total} multimodal cross-border shipments',
      'control_tower.table.node_filter': 'Node: {label} ({type})',
      'control_tower.table.corridor_filter': 'Corridor: {label} ({mode})',
      'control_tower.table.all_corridors': 'All Corridors Active',
      'control_tower.table.clear_filter': 'Clear Filter',
      'control_tower.table.view_all_shipments': 'View All Shipments',
      'control_tower.table.tracking_num': 'Tracking #',
      'control_tower.table.origin_destination': 'Origin → Destination',
      'control_tower.table.carrier': 'Carrier',
      'control_tower.table.current_stage': 'Current Stage',
      'control_tower.table.eta': 'ETA',
      'control_tower.table.status': 'Status',
      'control_tower.table.delay_risk': 'Delay Risk',
      'control_tower.table.no_shipments': 'No shipments found for the active filter',
      'control_tower.table.clear_filter_to_show_all': 'Clear filter to show all shipments',
      'control_tower.risk': 'RISK',

      // Freight Audit
      'freight_audit.title': '5-Leg Freight Cost Audit Engine',
      'freight_audit.subtitle':
        'Automated multi-leg invoice reconciliation, tariff validation, demurrage detection, and variance auditing.',
      'freight_audit.export_excel': 'Export to Excel (.xlsx)',
      'freight_audit.exporting': 'Exporting Matrix...',
      'freight_audit.kpi.total_contracted': 'Total Contracted',
      'freight_audit.kpi.target_baseline': 'Target Baseline',
      'freight_audit.kpi.agreed_tariffs': 'Agreed tariff rate-cards',
      'freight_audit.kpi.total_actual': 'Total Actual Billed',
      'freight_audit.kpi.invoiced': 'Invoiced',
      'freight_audit.kpi.carrier_invoice_total': 'Carrier invoice total',
      'freight_audit.kpi.net_variance': 'Net Variance',
      'freight_audit.kpi.balanced': 'Balanced against agreed contracts',
      'freight_audit.kpi.cost_overrun': 'Cost overrun detected',
      'freight_audit.kpi.savings': 'Volume discount savings secured',
      'freight_audit.kpi.disputed_stages': 'Disputed Stages',
      'freight_audit.kpi.dispute_active': 'Dispute Active',
      'freight_audit.kpi.all_clear': 'All Clear',
      'freight_audit.kpi.requires_justification': 'Requires auditor justification / credit',
      'freight_audit.kpi.zero_anomalies': 'Zero tariff anomalies detected',
      'freight_audit.kpi.legs': 'legs',
      'freight_audit.selector.title': 'Select Shipment Audit Target',
      'freight_audit.selector.subtitle':
        'Review 5-stage drayage, ocean/air, customs, rail, and final mile breakdown.',
      'freight_audit.selector.active': 'Active',
      'freight_audit.matrix.title': '5-Stage Reconciliation Matrix',
      'freight_audit.matrix.subtitle':
        'Granular comparison of contracted rate tariffs vs billed actuals with chromatic variance detection.',
      'freight_audit.matrix.policy': 'AUDIT-POLICY-2026',
      'freight_audit.matrix.leg': 'Leg',
      'freight_audit.table.num': '#',
      'freight_audit.table.stage_name': 'Stage / Leg Name',
      'freight_audit.table.contracted': 'Contracted ($)',
      'freight_audit.table.actual': 'Actual ($)',
      'freight_audit.table.variance': 'Variance ($)',
      'freight_audit.table.variance_pct': 'Variance (%)',
      'freight_audit.table.status': 'Status',
      'freight_audit.table.audit_notes': 'Audit Notes',
      'freight_audit.table.actions': 'Actions',
      'freight_audit.table.edit_audit': 'Edit/Audit',
      'freight_audit.table.no_notes': 'No notes entered.',
      'freight_audit.stage.origin_handling': 'Origin Drayage',
      'freight_audit.stage.transit_1': 'International Transit 1',
      'freight_audit.stage.customs_border': 'Customs Clearance & Border Crossing',
      'freight_audit.stage.transit_2': 'International Transit 2',
      'freight_audit.stage.final_destination': 'Final Mile Delivery',
      'freight_audit.modal.title': 'Audit Adjustment',
      'freight_audit.modal.leg_info': 'Leg {leg}: {stage} ({shipment})',
      'freight_audit.modal.close': 'Close modal',
      'freight_audit.modal.baseline_tariff': 'Baseline Contracted Tariff',
      'freight_audit.modal.msa_agreed_rate': 'Master Service Agreement agreed rate',
      'freight_audit.modal.actual_cost': 'Actual Incurred Cost ($ USD)',
      'freight_audit.modal.actual_cost_error': 'Actual cost must be a positive number.',
      'freight_audit.modal.live_variance_preview': 'Live Variance Preview',
      'freight_audit.modal.calculated_variance': 'Calculated Variance',
      'freight_audit.modal.auto_status_detection': 'Auto-Status Detection',
      'freight_audit.modal.status_override': 'Audit Status Override',
      'freight_audit.modal.status_approved': 'APPROVED (Within tolerance / Verified)',
      'freight_audit.modal.status_disputed': 'DISPUTED (Flagged for carrier rebate/waiver)',
      'freight_audit.modal.status_pending': 'PENDING (Awaiting supporting documents)',
      'freight_audit.modal.rule_note':
        'Rule: Automatically flags as DISPUTED when variance exceeds +5%.',
      'freight_audit.modal.audit_notes': 'Audit Notes & Discrepancy Justification',
      'freight_audit.modal.notes_placeholder':
        'Enter invoice discrepancy reasoning, tariff rule reference, or carrier dispute tracking...',
      'freight_audit.modal.cancel': 'Cancel',
      'freight_audit.modal.save': 'Save Audit Adjustment',
      'freight_audit.modal.saving': 'Saving...',
    },
  };

  /**
   * Sets current language and persists to localStorage.
   */
  setLanguage(lang: SupportedLanguage): void {
    this.currentLang.set(lang);
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(this.STORAGE_KEY, lang);
      } catch (e) {
        console.warn('Could not save language to localStorage:', e);
      }
    }
  }

  /**
   * Toggles between 'es' and 'en'.
   */
  toggleLanguage(): void {
    const next: SupportedLanguage = this.currentLang() === 'es' ? 'en' : 'es';
    this.setLanguage(next);
  }

  /**
   * Translates a dictionary key into current language with optional parameter interpolation.
   * Tracks signal dependency when called in reactive contexts.
   */
  translate(key: string, params?: Record<string, string | number>): string {
    const lang = this.currentLang();
    const dictionary = this.translations[lang] || this.translations['es'];
    let text = dictionary[key] ?? this.translations['en']?.[key] ?? key;

    if (params) {
      for (const [paramKey, paramVal] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
      }
    }

    return text;
  }

  /**
   * Shorthand alias for translate().
   */
  t(key: string, params?: Record<string, string | number>): string {
    return this.translate(key, params);
  }

  private getInitialLanguage(): SupportedLanguage {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored === 'en' || stored === 'es') {
          return stored;
        }
      } catch (e) {
        console.warn('Could not read language from localStorage:', e);
      }
    }
    return 'es';
  }
}
