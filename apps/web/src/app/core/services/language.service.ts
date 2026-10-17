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
      'control_tower.svg.origin': 'ORIGEN',
      'control_tower.svg.customs_border': 'ADUANA FRONTERIZA',
      'control_tower.svg.destination': 'DESTINO',
      'control_tower.node_status.NORMAL': 'NORMAL',
      'control_tower.node_status.DELAYED': 'RETRASADO',
      'control_tower.node_status.CONGESTED': 'CONGESTIONADO',
      'control_tower.mode.ROAD': 'TERRESTRE',
      'control_tower.mode.RAIL': 'FERROVIARIO',
      'control_tower.mode.OCEAN': 'MARÍTIMO',
      'control_tower.mode.AIR': 'AÉREO',
      'control_tower.status.IN_TRANSIT': 'EN TRÁNSITO',
      'control_tower.status.CUSTOMS_HOLD': 'RETENCIÓN ADUANAL',
      'control_tower.status.OUT_FOR_DELIVERY': 'EN REPARTO',
      'control_tower.status.DELIVERED': 'ENTREGADO',
      'control_tower.risk_badge.HIGH': 'Riesgo ALTO',
      'control_tower.risk_badge.MEDIUM': 'Riesgo MEDIO',
      'control_tower.risk_badge.LOW': 'Riesgo BAJO',
      'control_tower.place.Monterrey Assembly': 'Ensamblaje Monterrey',
      'control_tower.place.Guadalajara Hub': 'Hub Guadalajara',
      'control_tower.place.Nuevo Laredo Customs': 'Aduana Nuevo Laredo',
      'control_tower.place.Port of Houston': 'Puerto de Houston',
      'control_tower.place.DFW Fulfillment': 'Centro Distribución DFW',
      'control_tower.place.Chicago Depot': 'Terminal Chicago',
      'control_tower.corridor.Carretera 85D (Highway)': 'Carretera 85D (Autopista)',
      'control_tower.corridor.Ferromex Freight Corridor': 'Corredor Ferroviario Ferromex',
      'control_tower.corridor.Altamira Short-Sea Shuttle': 'Enlace Marítimo Corto Altamira',
      'control_tower.corridor.Air Express Cargo Line': 'Línea de Carga Aérea Exprés',
      'control_tower.corridor.I-35 Interstate Corridor': 'Corredor Interestatal I-35',
      'control_tower.corridor.BNSF Intermodal Express': 'Expreso Intermodal BNSF',
      'control_tower.corridor.I-45 Inland Connector': 'Conector Terrestre I-45',
      'control_tower.corridor.Midwest Air Cargo Direct': 'Carga Aérea Directa Medio Oeste',

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
      'freight_audit.shipment.CP-2026-X9810.subtitle': 'Marítimo / Retención Aduanal',
      'freight_audit.shipment.CP-2026-E4421.subtitle': 'Varianza de Chasis',
      'freight_audit.shipment.CP-2026-A1092.subtitle': 'Carga Aérea Limpia',
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
      'freight_audit.status.APPROVED': 'APROBADO',
      'freight_audit.status.DISPUTED': 'EN DISPUTA',
      'freight_audit.status.PENDING': 'PENDIENTE',
      'freight_audit.stage.origin_handling': 'Arrastre de Origen',
      'freight_audit.stage.transit_1': 'Tránsito Internacional 1',
      'freight_audit.stage.customs_border': 'Despacho Aduanal y Cruce Fronterizo',
      'freight_audit.stage.transit_2': 'Tránsito Internacional 2',
      'freight_audit.stage.final_destination': 'Entrega de Última Milla',
      'freight_audit.stage_code.ORIGIN_HANDLING': 'MANEJO_ORIGEN',
      'freight_audit.stage_code.TRANSIT_1': 'TRÁNSITO_1',
      'freight_audit.stage_code.CUSTOMS_BORDER': 'ADUANA_FRONTERA',
      'freight_audit.stage_code.TRANSIT_2': 'TRÁNSITO_2',
      'freight_audit.stage_code.FINAL_DESTINATION': 'DESTINO_FINAL',
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

      // Alert Center
      'alert_center.title': 'Centro de Incidentes Operativos y SLA',
      'alert_center.subtitle':
        'Gestión de incidentes críticos en tiempo real, temporizadores de incumplimiento de SLA, disparadores de escalamiento automatizado y responsabilidad de transportistas.',
      'alert_center.active_alerts': '3 Alertas Críticas Activas',
      'alert_center.kpi.critical_breaches': 'Incumplimientos Críticos',
      'alert_center.kpi.action_req': 'Acción Req.',
      'alert_center.kpi.critical_sub': 'SLA excedido > 4 horas',
      'alert_center.kpi.at_risk': 'SLAs en Riesgo (< 2 hrs)',
      'alert_center.kpi.at_risk_sub': 'Bajo monitoreo operativo',
      'alert_center.kpi.mttr': 'Tiempo Medio de Resolución (MTTR)',
      'alert_center.kpi.mttr_sub': '-12% vs mes anterior',
      'alert_center.kpi.resolved_today': 'Resueltos Hoy',
      'alert_center.kpi.resolved_sub': '✓ 100% cumplimiento de SLA',
      'alert_center.stream.title':
        'Flujo de Incidentes Activos con Cuenta Regresiva de Escalamiento',
      'alert_center.stream.engine_status': 'Motor de Auto-Escalamiento: ACTIVO',
      'alert_center.inc1.priority': 'P1 - CRÍTICO',
      'alert_center.inc1.location': '• Congestión en Puerto de Róterdam',
      'alert_center.inc1.title':
        'Retraso de Atraque de Buque Mayor a 18 Horas (MAERSK MC-KINNEY)',
      'alert_center.inc1.desc':
        '340 Contenedores Farmacéuticos Refrigerados en riesgo de desviación de cadena de frío.',
      'alert_center.inc1.timer_label': 'Temporizador de Escalamiento',
      'alert_center.inc2.priority': 'P2 - ELEVADO',
      'alert_center.inc2.location': "• Retención Aduanal en Chicago O'Hare",
      'alert_center.inc2.title':
        'Falta Documento de Factura Comercial para Manifiesto ORD-0941',
      'alert_center.inc2.desc':
        'Carga Aérea detenida en espera de verificación de certificado fitosanitario.',
      'alert_center.inc2.timer_label': 'Fecha Límite SLA',
      'alert_center.filter.all': 'Todas las Alertas',
      'alert_center.filter.critical': 'Críticas (P1)',
      'alert_center.filter.high': 'Elevadas (P2)',
      'alert_center.filter.medium': 'Medias',
      'alert_center.filter.low': 'Bajas',
      'alert_center.filter.open': 'Abiertas',
      'alert_center.filter.resolved': 'Resueltas',
      'alert_center.financial_impact': 'Impacto Financiero Total',
      'alert_center.resolve_modal.title': 'Resolver Incidente Operativo',
      'alert_center.resolve_modal.subtitle':
        'Ingrese la justificación requerida para el registro de auditoría.',
      'alert_center.resolve_modal.notes_label': 'Notas de Resolución / Justificación',
      'alert_center.resolve_modal.notes_placeholder':
        'Ej. Aprobado permiso de atraque prioritario con autoridad portuaria...',
      'alert_center.resolve_modal.btn_cancel': 'Cancelar',
      'alert_center.resolve_modal.btn_confirm': 'Confirmar Resolución',
      'alert_center.resolve_modal.resolving': 'Resolviendo...',
      'alert_center.sla_breached': 'INCUMPLIDO',
      'alert_center.sla_remaining': 'Tiempo Restante',
      'alert_center.carrier': 'Transportista',
      'alert_center.tracking': 'Rastreo',
      'alert_center.status_label': 'Estado',
      'alert_center.resolve_action': 'Resolver Incidente',
      'alert_center.resolved_badge': 'Resuelto',

      // Shipments
      'shipments.title': 'Rastreo de Envíos y Notas de 3 Niveles',
      'shipments.subtitle':
        'Trazabilidad integral del ciclo de vida del envío con notas jerárquicas estructuradas en Master Bill, House Bill y Artículo de Carga SKU.',
      'shipments.new_booking': 'Nueva Reserva',
      'shipments.kpi.total_active': 'Total de Envíos Activos',
      'shipments.kpi.green_channel': '✓ 94% Canal Verde',
      'shipments.kpi.ocean_containers': 'Contenedores Marítimos (FCL/LCL)',
      'shipments.kpi.ocean_sub': '68% del volumen activo',
      'shipments.kpi.air_express': 'Guías Aéreas Exprés (AWB)',
      'shipments.kpi.air_sub': 'Carga prioritaria expedita',
      'shipments.kpi.rail_cars': 'Vagones Ferroviarios Intermodales',
      'shipments.kpi.rail_sub': 'Conexiones de red terrestre',
      'shipments.table.tracking': 'No. de Rastreo',
      'shipments.table.origin_destination': 'Origen / Destino',
      'shipments.table.carrier': 'Transportista',
      'shipments.table.status': 'Estado',
      'shipments.table.eta': 'Fecha Estimada (ETA)',
      'shipments.table.alerts': 'Alertas',
      'shipments.table.actions': 'Acciones',
      'shipments.table.open_notes': 'Ver Bitácora',
      'shipments.table.search_placeholder':
        'Buscar por rastreo, transportista, origen o destino...',
      'shipments.tree.title': 'Bitácora Colaborativa Jerárquica de 3 Niveles',
      'shipments.tree.level1': 'Nivel 1 (Master B/L)',
      'shipments.tree.level2': 'Nivel 2 (House B/L)',
      'shipments.tree.level3': 'Nivel 3 (Ítem SKU)',
      'shipments.tree.reply': 'Responder',
      'shipments.tree.max_depth_reached':
        'Profundidad máxima de 3 niveles alcanzada',
      'shipments.tree.add_root_note': 'Nueva Nota Principal (Nivel 1)',
      'shipments.tree.author': 'Autor',
      'shipments.tree.empty': 'No hay notas registradas para este envío aún.',
      'shipments.tree.content_placeholder':
        'Escriba su nota o instrucción de operación...',
      'shipments.tree.btn_send': 'Publicar Nota',
      'shipments.tree.btn_close': 'Cerrar Bitácora',
      'shipments.booking.title': 'Nueva Reserva de Envío',
      'shipments.booking.tracking': 'No. de Rastreo',
      'shipments.booking.origin': 'Terminal / Ciudad de Origen',
      'shipments.booking.destination': 'Destino Final',
      'shipments.booking.carrier': 'Transportista Asignado',
      'shipments.booking.btn_submit': 'Crear Envío (5 Tramos)',
      'shipments.booking.btn_cancel': 'Cancelar',
      'shipments.notes.title': 'Sistema Jerárquico de Notas Operativas de 3 Niveles',
      'shipments.notes.subtitle':
        'Registro de auditoría granular y comunicaciones en todos los niveles de carga.',
      'shipments.notes.preview_badge': 'Modelo de Vista Previa',
      'shipments.notes.l1.badge': 'NIVEL 1: MASTER B/L',
      'shipments.notes.l1.tier': 'Nivel Transportista',
      'shipments.notes.l1.title': 'Nivel Maestro de Buque Marítimo / Vuelo',
      'shipments.notes.l1.desc':
        'Instrucciones generales marítimas o aéreas, alertas de demora en terminal, avisos de cambio de transportista y notas de congestión portuaria.',
      'shipments.notes.l2.badge': 'NIVEL 2: HOUSE B/L',
      'shipments.notes.l2.tier': 'Nivel Agente de Carga',
      'shipments.notes.l2.title': 'Directivas de Consignatario y Embarcador',
      'shipments.notes.l2.desc':
        'Despacho de agente aduanal, liberación de almacén fiscal, citas de entrega y aprobaciones de certificados fitosanitarios.',
      'shipments.notes.l3.badge': 'NIVEL 3: ARTÍCULO SKU',
      'shipments.notes.l3.tier': 'Nivel Carga',
      'shipments.notes.l3.title': 'Telemetría Individual de Tarima y Unidad',
      'shipments.notes.l3.desc':
        'Clasificación de materiales peligrosos (HAZMAT), lecturas de sensores IoT de temperatura/impacto, códigos de barras de lote y rastreo de serie.',

      // Login
      'login.subtitle':
        'Torre de Control Logístico e Inteligencia de Cadena de Suministro',
      'login.work_email': 'Correo Corporativo',
      'login.email_placeholder': 'nombre@cargopulse.com',
      'login.email_required': 'El correo electrónico es obligatorio.',
      'login.email_invalid': 'Por favor ingrese un correo electrónico válido.',
      'login.password': 'Contraseña',
      'login.min_chars': 'Mín. 6 caracteres',
      'login.password_required': 'La contraseña es obligatoria.',
      'login.password_minlength': 'La contraseña debe tener al menos 6 caracteres.',
      'login.authenticating': 'Autenticando...',
      'login.sign_in': 'Iniciar Sesión en Torre de Control',
      'login.demo_title': 'Acceso Rápido Demo',
      'login.demo_subtitle':
        'Inicio de sesión instantáneo con 1 clic y credenciales preconfiguradas',
      'login.role.admin': 'Administrador',
      'login.role.operator': 'Operador Logístico',
      'login.role.auditor': 'Auditor de Fletes',
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
      'control_tower.svg.origin': 'ORIGIN',
      'control_tower.svg.customs_border': 'CUSTOMS BORDER',
      'control_tower.svg.destination': 'DESTINATION',
      'control_tower.node_status.NORMAL': 'NORMAL',
      'control_tower.node_status.DELAYED': 'DELAYED',
      'control_tower.node_status.CONGESTED': 'CONGESTED',
      'control_tower.mode.ROAD': 'ROAD',
      'control_tower.mode.RAIL': 'RAIL',
      'control_tower.mode.OCEAN': 'OCEAN',
      'control_tower.mode.AIR': 'AIR',
      'control_tower.status.IN_TRANSIT': 'IN TRANSIT',
      'control_tower.status.CUSTOMS_HOLD': 'CUSTOMS HOLD',
      'control_tower.status.OUT_FOR_DELIVERY': 'OUT FOR DELIVERY',
      'control_tower.status.DELIVERED': 'DELIVERED',
      'control_tower.risk_badge.HIGH': 'HIGH Risk',
      'control_tower.risk_badge.MEDIUM': 'MEDIUM Risk',
      'control_tower.risk_badge.LOW': 'LOW Risk',
      'control_tower.place.Monterrey Assembly': 'Monterrey Assembly',
      'control_tower.place.Guadalajara Hub': 'Guadalajara Hub',
      'control_tower.place.Nuevo Laredo Customs': 'Nuevo Laredo Customs',
      'control_tower.place.Port of Houston': 'Port of Houston',
      'control_tower.place.DFW Fulfillment': 'DFW Fulfillment',
      'control_tower.place.Chicago Depot': 'Chicago Depot',
      'control_tower.corridor.Carretera 85D (Highway)': 'Carretera 85D (Highway)',
      'control_tower.corridor.Ferromex Freight Corridor': 'Ferromex Freight Corridor',
      'control_tower.corridor.Altamira Short-Sea Shuttle': 'Altamira Short-Sea Shuttle',
      'control_tower.corridor.Air Express Cargo Line': 'Air Express Cargo Line',
      'control_tower.corridor.I-35 Interstate Corridor': 'I-35 Interstate Corridor',
      'control_tower.corridor.BNSF Intermodal Express': 'BNSF Intermodal Express',
      'control_tower.corridor.I-45 Inland Connector': 'I-45 Inland Connector',
      'control_tower.corridor.Midwest Air Cargo Direct': 'Midwest Air Cargo Direct',

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
      'freight_audit.shipment.CP-2026-X9810.subtitle': 'Ocean / Customs Hold',
      'freight_audit.shipment.CP-2026-E4421.subtitle': 'Chassis Variance',
      'freight_audit.shipment.CP-2026-A1092.subtitle': 'Clean Air Cargo',
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
      'freight_audit.status.APPROVED': 'APPROVED',
      'freight_audit.status.DISPUTED': 'DISPUTED',
      'freight_audit.status.PENDING': 'PENDING',
      'freight_audit.stage.origin_handling': 'Origin Drayage',
      'freight_audit.stage.transit_1': 'International Transit 1',
      'freight_audit.stage.customs_border': 'Customs Clearance & Border Crossing',
      'freight_audit.stage.transit_2': 'International Transit 2',
      'freight_audit.stage.final_destination': 'Final Mile Delivery',
      'freight_audit.stage_code.ORIGIN_HANDLING': 'ORIGIN_HANDLING',
      'freight_audit.stage_code.TRANSIT_1': 'TRANSIT_1',
      'freight_audit.stage_code.CUSTOMS_BORDER': 'CUSTOMS_BORDER',
      'freight_audit.stage_code.TRANSIT_2': 'TRANSIT_2',
      'freight_audit.stage_code.FINAL_DESTINATION': 'FINAL_DESTINATION',
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

      // Alert Center
      'alert_center.title': 'Operational Incidents & SLA Center',
      'alert_center.subtitle':
        'Real-time critical incident management, SLA breach countdown timers, automated escalation triggers, and carrier accountability.',
      'alert_center.active_alerts': '3 Active Critical Alerts',
      'alert_center.kpi.critical_breaches': 'Critical Breaches',
      'alert_center.kpi.action_req': 'Action Req',
      'alert_center.kpi.critical_sub': 'SLA exceeded > 4 hours',
      'alert_center.kpi.at_risk': 'At-Risk SLAs (< 2 hrs)',
      'alert_center.kpi.at_risk_sub': 'Under operational monitoring',
      'alert_center.kpi.mttr': 'Mean Time to Resolution (MTTR)',
      'alert_center.kpi.mttr_sub': '-12% vs prior month',
      'alert_center.kpi.resolved_today': 'Resolved Today',
      'alert_center.kpi.resolved_sub': '✓ 100% SLA compliance adherence',
      'alert_center.stream.title':
        'Active Incident Stream with Live Escalation Countdowns',
      'alert_center.stream.engine_status': 'Auto-Escalation Engine: ACTIVE',
      'alert_center.inc1.priority': 'P1 - CRITICAL',
      'alert_center.inc1.location': '• Port of Rotterdam Congestion',
      'alert_center.inc1.title':
        'Vessel Berth Delay Exceeding 18 Hours (MAERSK MC-KINNEY)',
      'alert_center.inc1.desc':
        '340 Refrigerated Pharma Containers at risk of cold-chain deviation.',
      'alert_center.inc1.timer_label': 'Escalation Timer',
      'alert_center.inc2.priority': 'P2 - ELEVATED',
      'alert_center.inc2.location': "• Chicago O'Hare Customs Hold",
      'alert_center.inc2.title':
        'Missing Commercial Invoice Document for Manifest ORD-0941',
      'alert_center.inc2.desc':
        'Air Freight Cargo grounded pending phytosanitary certificate verification.',
      'alert_center.inc2.timer_label': 'SLA Deadline',
      'alert_center.filter.all': 'All Alerts',
      'alert_center.filter.critical': 'Critical (P1)',
      'alert_center.filter.high': 'Elevated (P2)',
      'alert_center.filter.medium': 'Medium',
      'alert_center.filter.low': 'Low',
      'alert_center.filter.open': 'Open',
      'alert_center.filter.resolved': 'Resolved',
      'alert_center.financial_impact': 'Total Financial Impact',
      'alert_center.resolve_modal.title': 'Resolve Operational Incident',
      'alert_center.resolve_modal.subtitle':
        'Enter required justification for audit trail logging.',
      'alert_center.resolve_modal.notes_label': 'Resolution Notes / Justification',
      'alert_center.resolve_modal.notes_placeholder':
        'E.g. Approved priority berth clearance with port authority...',
      'alert_center.resolve_modal.btn_cancel': 'Cancel',
      'alert_center.resolve_modal.btn_confirm': 'Confirm Resolution',
      'alert_center.resolve_modal.resolving': 'Resolving...',
      'alert_center.sla_breached': 'BREACHED',
      'alert_center.sla_remaining': 'Remaining Time',
      'alert_center.carrier': 'Carrier',
      'alert_center.tracking': 'Tracking',
      'alert_center.status_label': 'Status',
      'alert_center.resolve_action': 'Resolve Incident',
      'alert_center.resolved_badge': 'Resolved',

      // Shipments
      'shipments.title': 'Shipment Tracking & 3-Level Notes',
      'shipments.subtitle':
        'End-to-end shipment lifecycle tracing with hierarchical notes structured across Master Bill, House Bill, and SKU Cargo Item.',
      'shipments.new_booking': 'New Booking',
      'shipments.kpi.total_active': 'Total Active Shipments',
      'shipments.kpi.green_channel': '✓ 94% Green Channel',
      'shipments.kpi.ocean_containers': 'Ocean Containers (FCL/LCL)',
      'shipments.kpi.ocean_sub': '68% of active volume',
      'shipments.kpi.air_express': 'Air Express AWB',
      'shipments.kpi.air_sub': 'Priority expedited cargo',
      'shipments.kpi.rail_cars': 'Intermodal Rail Cars',
      'shipments.kpi.rail_sub': 'Inland network connections',
      'shipments.table.tracking': 'Tracking Number',
      'shipments.table.origin_destination': 'Origin / Destination',
      'shipments.table.carrier': 'Carrier',
      'shipments.table.status': 'Status',
      'shipments.table.eta': 'Estimated ETA',
      'shipments.table.alerts': 'Alerts',
      'shipments.table.actions': 'Actions',
      'shipments.table.open_notes': 'View Notes Tree',
      'shipments.table.search_placeholder':
        'Search by tracking, carrier, origin, or destination...',
      'shipments.tree.title': 'Hierarchical 3-Level Collaborative Notes Tree',
      'shipments.tree.level1': 'Level 1 (Master B/L)',
      'shipments.tree.level2': 'Level 2 (House B/L)',
      'shipments.tree.level3': 'Level 3 (SKU Item)',
      'shipments.tree.reply': 'Reply',
      'shipments.tree.max_depth_reached':
        'Maximum 3-level thread depth reached',
      'shipments.tree.add_root_note': 'New Root Note (Level 1)',
      'shipments.tree.author': 'Author',
      'shipments.tree.empty': 'No notes recorded for this shipment yet.',
      'shipments.tree.content_placeholder':
        'Write operational instruction or note...',
      'shipments.tree.btn_send': 'Post Note',
      'shipments.tree.btn_close': 'Close Notes',
      'shipments.booking.title': 'New Shipment Booking',
      'shipments.booking.tracking': 'Tracking Number',
      'shipments.booking.origin': 'Origin Terminal / City',
      'shipments.booking.destination': 'Final Destination',
      'shipments.booking.carrier': 'Assigned Carrier',
      'shipments.booking.btn_submit': 'Create Shipment (5 Stages)',
      'shipments.booking.btn_cancel': 'Cancel',
      'shipments.notes.title': 'Hierarchical 3-Level Operational Notes System',
      'shipments.notes.subtitle':
        'Granular audit logging and communications across freight levels.',
      'shipments.notes.preview_badge': 'Preview Model',
      'shipments.notes.l1.badge': 'LEVEL 1: MASTER B/L',
      'shipments.notes.l1.tier': 'Carrier Tier',
      'shipments.notes.l1.title': 'Ocean Vessel / Flight Master Level',
      'shipments.notes.l1.desc':
        'Broad maritime or airway instructions, terminal demurrage alerts, carrier change notices, and port congestion notes.',
      'shipments.notes.l2.badge': 'LEVEL 2: HOUSE B/L',
      'shipments.notes.l2.tier': 'Forwarder Tier',
      'shipments.notes.l2.title': 'Consignee & Shipper Directives',
      'shipments.notes.l2.desc':
        'Customs broker dispatch, bonded warehouse release, delivery appointments, and phytosanitary certificate approvals.',
      'shipments.notes.l3.badge': 'LEVEL 3: SKU ITEM',
      'shipments.notes.l3.tier': 'Cargo Tier',
      'shipments.notes.l3.title': 'Individual Pallet & Unit Telemetry',
      'shipments.notes.l3.desc':
        'Hazardous materials (HAZMAT) classification, IoT temperature/shock sensor readings, batch barcodes, and serial tracking.',

      // Login
      'login.subtitle': 'Logistics Control Tower & Supply Chain Intelligence',
      'login.work_email': 'Work Email',
      'login.email_placeholder': 'name@cargopulse.com',
      'login.email_required': 'Email address is required.',
      'login.email_invalid': 'Please enter a valid email address.',
      'login.password': 'Password',
      'login.min_chars': 'Min. 6 chars',
      'login.password_required': 'Password is required.',
      'login.password_minlength': 'Password must be at least 6 characters.',
      'login.authenticating': 'Authenticating...',
      'login.sign_in': 'Sign In to Control Tower',
      'login.demo_title': 'Quick Demo Access',
      'login.demo_subtitle': 'Instant 1-click login with pre-seeded role credentials',
      'login.role.admin': 'Administrator',
      'login.role.operator': 'Logistics Operator',
      'login.role.auditor': 'Freight Auditor',
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
