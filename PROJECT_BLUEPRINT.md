# CARGOPULSE — Master Architecture & Project Specification Blueprint

> **Metadata de Transición y Trazabilidad:**
> - **Proyecto:** CargoPulse (Enterprise Logistics Operations & 5-Leg Freight Audit Platform)
> - **Autor / Candidato:** Kevin Fernando Torres Castro (Ingeniero en Sistemas, UNAH 2025)
> - **Objetivo Profesional:** Portafolio técnico de código abierto para vacantes remotas internacionales en dólares (Mid / Semi-Senior Frontend & Full-Stack).
> - **Zona Horaria:** Honduras (UTC-6) — solapamiento completo con horario de EE. UU. (US Central).
> - **Nivel de Inglés:** B1+ (lectura técnica y comunicación escrita sólidas).
> - **Conversación de Origen:** `conversation://e2ad3bf1-642c-4e41-a51d-a8314a8110ac`
> - **Auditoría Técnica Base:** `C:\Users\Fer\Downloads\auditoria_arquitectura_portafolio.md`

---

## 1. ¿Qué es CargoPulse? (Definición del Negocio y Problema Real)

**CargoPulse** es una **Torre de Control Logístico y Plataforma SaaS de Auditoría de Fletes** inspirada en los sistemas empresariales reales de misión crítica auditados en el archivo `auditoria_arquitectura_portafolio.md` (específicamente la fusión de `CCT21`, `AnalisisImpactoV21`, `ProjectV21` y `sistemaalertas`).

### El Problema de la Industria:
Las empresas de logística y distribución multimodal que mueven carga internacional a través de fronteras enfrentan tres problemas críticos:
1. **Ceguera Topológica:** Falta de visibilidad gráfica en tiempo real de los envíos a lo largo de los nodos de la red (puertos, aduanas fronterizas, plantas de origen y almacenes destino).
2. **Fugas de Capital y Desviación Tarifaria:** Sobrecostos en fletes cobrados por transportistas terrestres que difieren de las tarifas pactadas, requiriendo auditoría manual compleja en múltiples etapas.
3. **Incidencias Desatendidas y Pérdidas SLA:** Falta de trazabilidad en incidentes operativos (averías mecánicas, retenciones aduaneras, demoras en frontera) que generan pérdidas económicas acumulativas.

### Los 4 Módulos Funcionales de CargoPulse:
1. **Control Tower & Topology DAG:** Visualización de la red como un Grafo Acíclico Dirigido (`@swimlane/ngx-graph`) con nodos de Origen (círculo azul), Aduana/Frontera (cuadrado oscuro) y Destino (triángulo rojo). Filtrado reactivo de envíos al seleccionar cualquier nodo o arista de tránsito.
2. **Freight Cost Audit (Motor de 5 Tramos):** Matriz dinámica de conciliación de fletes que audita costos en: *Origen $\rightarrow$ Tránsito 1 $\rightarrow$ Aduana/Frontera $\rightarrow$ Tránsito 2 $\rightarrow$ Destino*. Cálculo automático de desviaciones (`costoReal - costoCotizado`) con semáforos cromáticos (verde/rojo) y exportación estilizada a Excel vía `ExcelJS`.
3. **Operational Incident & Alert Center:** Tablero gerencial con tarjetas KPI (Total, Alta, Media, Baja), contador de SLA en vivo (`DD:HH:MM`), sumatoria de impacto financiero acumulado en USD y flujo de resolución/cierre de incidencias.
4. **Shipment Tracking & 3-Level Collaborative Notes:** Registro y seguimiento del ciclo de vida del embarque con bitácora colaborativa jerárquica en 3 niveles (*Nota Principal $\rightarrow$ Réplica $\rightarrow$ Subcomentario*) con soporte para evidencias documentales.

---

## 2. Decisiones Arquitectónicas Fundamentales

### ¿Por qué Monolito Modular en un Monorepo?
- **NO Microservicios Puros:** Evita la sobreingeniería innecesaria de múltiples repositorios, orquestadores complejos de redes y latencia innecesaria para un portafolio de un solo desarrollador.
- **SÍ Monolito Modular:** El backend NestJS organiza cada dominio (`shipments`, `freight-audit`, `alert-center`, `collaboration`) en módulos desacoplados con sus propios controladores, servicios, DTOs y entidades. Cada módulo es un *Bounded Context* que puede ser extraído a microservicio en el futuro sin refactorizar la lógica interna.
- **Monorepo Estructurado:** `apps/api` (NestJS) y `apps/web` (Angular 21) conviviendo en el mismo repositorio, compartiendo tipos e interfaces y orquestados por Docker Compose.

---

## 3. Constitución de Ingeniería y Reglas de Código Estrictas

1. **Principio de Responsabilidad Única (SRP):**
   - **Componentes:** Solo pintan UI y capturan eventos del usuario. No contienen lógica de negocio compleja ni peticiones HTTP directas.
   - **Stores / Estado:** Centralizan las Signals (`signal()`, `computed()`) y la reactividad.
   - **Servicios HTTP:** Exclusivamente ejecutan peticiones al API y tipan fuertemente la respuesta.
   - **Controladores NestJS:** Solo reciben peticiones, aplican DTOs/Guards y delegan al servicio. Cero lógica de negocio en controladores.
2. **Angular 21 Puro, Zoneless y Signals:**
   - 100% Componentes `standalone: true`. Prohibido crear o usar `NgModules`.
   - Reactividad gobernada por **Angular Signals** (`signal()`, `computed()`, `effect()`).
   - Modo **Zoneless** (sin `zone.js`). Cero llamadas manuales a `ChangeDetectorRef.detectChanges()`.
   - Nuevo Control Flow obligatorio: `@if`, `@for`, `@empty`, `@defer (on viewport)`.
   - UI limpia y profesional con **Tailwind CSS** o **Angular Material**. Cero librerías obsoletas (`jQuery`, `jqxGrid`, `metro4`).
3. **Backend NestJS con Tipado y Validación Rigurosa:**
   - Prohibido el uso de `any`.
   - Validación automática de entradas mediante `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })` y `class-validator`.
   - Autenticación real con JWT (`@nestjs/jwt`, `Passport`, `JwtAuthGuard`).
   - Documentación OpenAPI/Swagger en vivo en `/api/docs`.
   - Respuestas normalizadas vía `TransformInterceptor` (`{ success: true, data: ..., timestamp: ... }`).
   - Manejo centralizado de errores vía `HttpExceptionFilter`.
4. **Base de Datos y Persistencia:**
   - ORM: **Prisma** o **TypeORM** sobre **PostgreSQL**.
   - Esquemas versionados mediante migraciones formales.
   - Semillas de datos (`seed.ts`) con escenarios de negocio logísticos reales.

---

## 4. Estado del Entorno Local del Desarrollador (Auditoría Verificada)

- **Git:** Instalado (`v2.51.0`) — listo para conectar a GitHub.
- **Node.js:** Instalado (`v20.20.0` LTS) — 100% compatible.
- **npm:** Instalado (`v10.8.2`).
- **Angular CLI:** Instalado (`v21.2.10`) — ¡Angular 21 nativo listo!
- **Nest CLI (`nest`):** *Pendiente de instalar:* `npm install -g @nestjs/cli`.
- **Playwright:** *Se instalará en el Sprint 6 dentro del proyecto* (`npm init playwright@latest`).
- **Docker Desktop:** *Pendiente de instalación para el Sprint 6* (se puede orquestar con `docker-compose.yml` y testear localmente).

---

## 5. Estructura Física del Proyecto (`C:\Users\Fer\CargoPulse`)

```text
CargoPulse/
├── apps/
│   ├── api/                           <-- Backend NestJS (Modular Monolith)
│   │   ├── src/
│   │   │   ├── core/                  <-- Guards, Interceptors, Filters globales
│   │   │   ├── database/              <-- Prisma / TypeORM (Schema, Migrations, Seeds)
│   │   │   ├── modules/
│   │   │   │   ├── auth/              <-- JWT, LocalStrategy, AuthController
│   │   │   │   ├── shipments/         <-- Gestión de envíos y tracking
│   │   │   │   ├── freight-audit/     <-- Motor de conciliación de 5 tramos
│   │   │   │   ├── alert-center/      <-- Alertas, SLAs e impacto USD
│   │   │   │   └── collaboration/     <-- Hilos de notas en 3 niveles
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── web/                           <-- Frontend Angular 21 (Standalone + Signals)
│       ├── src/
│       │   ├── app/
│       │   │   ├── core/              <-- Singletons, AuthState, Interceptors
│       │   │   ├── shared/            <-- Dumb UI Components, Pipes, Directivas
│       │   │   ├── features/
│       │   │   │   ├── control-tower/ <-- Grafo topológico DAG (ngx-graph)
│       │   │   │   ├── freight-audit/ <-- Grilla de 5 etapas y ExcelJS export
│       │   │   │   ├── alert-center/  <-- Bandeja de alertas y SLAs en vivo
│       │   │   │   └── shipments/     <-- CRUD de envíos y formulario reactivo
│       │   │   ├── app.routes.ts
│       │   │   └── app.config.ts
│       ├── Dockerfile
│       └── package.json
│
├── e2e/                               <-- Pruebas E2E con Playwright
├── .github/
│   └── workflows/
│       └── ci.yml                     <-- Pipeline CI/CD (Lint, Build, Playwright)
├── docker-compose.yml                 <-- PostgreSQL + API + Web en 1 comando
├── ARCHITECTURE.md                    <-- Especificación de arquitectura y patrones
├── ROADMAP.md                         <-- Checklist de Sprints y tareas granulares
└── README.md                          <-- Documentación profesional pública en inglés
```

---

## 6. WBS Completo: Plan Granular de 8 Sprints

### Sprint 0: Entorno, Repositorio & Scaffolding
- [ ] 0.1 Crear carpeta `C:\Users\Fer\CargoPulse`.
- [ ] 0.2 Instalar Nest CLI (`npm i -g @nestjs/cli`).
- [ ] 0.3 Inicializar Git en `main` con `.gitignore` exhaustivo.
- [ ] 0.4 Crear estructura `apps/api`, `apps/web`, `e2e/`.
- [ ] 0.5 Generar `ARCHITECTURE.md` y `ROADMAP.md`.

### Sprint 1: Backend Core, Base de Datos & Auth (NestJS)
- [ ] 1.1 Inicializar NestJS en `apps/api`.
- [ ] 1.2 Configurar `@nestjs/config` con variables de entorno validadas.
- [ ] 1.3 Configurar Prisma ORM conectado a PostgreSQL.
- [ ] 1.4 Modelar entidades en `schema.prisma`: User, Shipment, FreightStage, Alert, Note.
- [ ] 1.5 Ejecutar migración inicial y crear script de semillas realistas (`seed.ts`).
- [ ] 1.6 Implementar `AuthModule` (JWT, bcrypt, `JwtAuthGuard`).
- [ ] 1.7 Habilitar Swagger en `/api/docs` con decoradores OpenAPI.
- [ ] 1.8 Configurar `TransformInterceptor` y `HttpExceptionFilter`.

### Sprint 2: Lógica de Negocio Backend (Shipments, Auditoría & Alertas)
- [ ] 2.1 Implementar `ShipmentsModule` (CRUD de envíos, tracking de estados).
- [ ] 2.2 Implementar `FreightAuditModule` (Cálculo de desviaciones en 5 tramos y exportación Excel server-side).
- [ ] 2.3 Implementar `AlertCenterModule` (SLA dinámico `DD:HH:MM`, impacto financiero en USD).
- [ ] 2.4 Implementar `CollaborationModule` (Notas jerárquicas en 3 niveles con adjuntos).

### Sprint 3: Frontend Base & UI System (Angular 21)
- [ ] 3.1 Crear app Angular 21 en `apps/web` (Standalone, Zoneless).
- [ ] 3.2 Configurar Tailwind CSS / Angular Material con tema corporativo.
- [ ] 3.3 Crear `AuthStore` basado en Angular Signals.
- [ ] 3.4 Implementar `AuthInterceptor` para tokens JWT.
- [ ] 3.5 Construir Layout maestro (Navbar, Sidebar colapsable, RouterOutlet).
- [ ] 3.6 Construir pantalla de Login con validaciones reactivas.

### Sprint 4: Torre de Control (Grafo DAG) & Grilla de Auditoría
- [ ] 4.1 Instalar e integrar `@swimlane/ngx-graph` en `apps/web`.
- [ ] 4.2 Construir pantalla **Control Tower**: Nodos interactivos de red y filtrado dinámico.
- [ ] 4.3 Construir pantalla **Freight Cost Audit**: Grilla de 5 etapas, semáforos de varianza y exportación ExcelJS.

### Sprint 5: Bitácora de 3 Niveles & Centro de Alertas SLA
- [ ] 5.1 Construir pantalla **Alert Center**: KPIs reactivos, SLAs en vivo y modal de cierre con justificación.
- [ ] 5.2 Construir componente de **Bitácora Colaborativa**: Hilos indentados de 3 niveles y adjuntos.

### Sprint 6: Testing E2E (Playwright) & Dockerización
- [ ] 6.1 Inicializar Playwright en `e2e/`.
- [ ] 6.2 Test E2E 1: Flujo de Autenticación.
- [ ] 6.3 Test E2E 2: Creación de envío y verificación en Grafo/Tabla.
- [ ] 6.4 Test E2E 3: Auditoría de costos y detección de alerta tarifaria.
- [ ] 6.5 Dockerfile multi-stage para NestJS.
- [ ] 6.6 Dockerfile con Nginx para Angular 21.
- [ ] 6.7 `docker-compose.yml` para levantar PostgreSQL + API + Web en 1 comando.

### Sprint 7: CI/CD, Despliegue Público & Publicación en GitHub
- [ ] 7.1 Configurar `.github/workflows/ci.yml` (Lint, Build, Playwright headless).
- [ ] 7.2 Desplegar API + DB gratis (Render / Supabase / Railway).
- [ ] 7.3 Desplegar Frontend gratis (Vercel / Netlify / GitHub Pages).
- [ ] 7.4 Redactar `README.md` maestro en inglés con badges, capturas y arquitectura Mermaid.
- [ ] 7.5 Publicar repositorio en GitHub y vincular en CV y LinkedIn.
