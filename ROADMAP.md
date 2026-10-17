# CARGOPULSE — Granular 8-Sprint Roadmap & Execution Matrix

> **Project:** CargoPulse (Enterprise Logistics Operations & 5-Leg Freight Audit Platform)  
> **Status:** All 8 Sprints Completed (Production Ready & Published)  
> **Tracking File:** Updated continuously at each milestone  

---

## Sprint 0: Entorno, Repositorio & Scaffolding
- [x] **0.1** Verificar entorno local y estructura base de workspace (`C:\Users\Fer\CargoPulse`).
- [x] **0.2** Instalar Nest CLI (`@nestjs/cli@12.0.8`) y validar en PATH.
- [x] **0.3** Inicializar Git en rama `main` con `.gitignore` exhaustivo (Node, Nest, Angular, Prisma, OS, env).
- [x] **0.4** Scaffolding de `apps/api` (NestJS Modular Monolith).
- [x] **0.5** Scaffolding de `apps/web` (Angular 21 Standalone & Zoneless).
- [x] **0.6** Crear carpetas base de integración (`e2e/`, `.github/workflows/`).
- [x] **0.7** Generar `ARCHITECTURE.md` y `ROADMAP.md`.
- [x] **0.8** Commit inicial del Sprint 0 (`chore: sprint 0 monorepo scaffolding and project foundations`).

---

## Sprint 1: Backend Core, Base de Datos & Auth (NestJS)
- [x] **1.1** Configuración de variables de entorno con validación estricta (`@nestjs/config` + helpers en `env.config.ts`).
- [x] **1.2** Configuración de Prisma ORM conectado a PostgreSQL con `PrismaService` y `PrismaModule`.
- [x] **1.3** Modelado completo en `schema.prisma`:
  - `User` & `Role` (ADMIN, LOGISTICS_OPERATOR, FREIGHT_AUDITOR)
  - `Shipment` & `ShipmentStatus` (8 estados de ciclo de vida)
  - `FreightStage` (5 tramos: ORIGIN_HANDLING, TRANSIT_1, CUSTOMS_BORDER, TRANSIT_2, FINAL_DESTINATION)
  - `Alert` & `AlertSeverity` & `AlertStatus`
  - `Note` (Estructura de bitácora en 3 niveles con relación `parentId`)
- [x] **1.4** Generar cliente Prisma (`@prisma/client`) e implementar script de semillas realistas (`seed.ts` con bcrypt).
- [x] **1.5** Implementar `AuthModule` (Registro, Login, hashing bcrypt, JWT, `JwtAuthGuard`, `RolesGuard`, `@CurrentUser()`).
- [x] **1.6** Configurar Swagger/OpenAPI en `/api/docs` con esquemas tipados y autenticación Bearer.
- [x] **1.7** Configurar `TransformInterceptor` y `HttpExceptionFilter` global en NestJS.

---

## Sprint 2: Lógica de Negocio Backend (Shipments, Auditoría & Alertas)
- [x] **2.1** `ShipmentsModule`: CRUD de envíos, filtrado multicriterio, generación de código `CP-XXXXXX`, cálculo de 5 tramos por defecto, actualización de estados de ciclo de vida.
- [x] **2.2** `FreightAuditModule`: Motor de cálculo de desviaciones en 5 tramos (`costoReal - costoCotizado`), reglas de varianza y exportación a Excel server-side con `ExcelJS` estilizado.
- [x] **2.3** `AlertCenterModule`: Centro de alertas, cálculo dinámico de SLAs en vivo (`DD:HH:MM`) y sumatoria de impacto financiero en USD con resolución justificada.
- [x] **2.4** `CollaborationModule`: Hilos jerárquicos de 3 niveles (*Nota Principal $\rightarrow$ Réplica $\rightarrow$ Subcomentario*) con validación de profundidad máxima y adjuntos.

---

## Sprint 3: Frontend Base & UI System (Angular 21)
- [x] **3.1** Configuración de Tailwind CSS con paleta corporativa logística y tipografía Inter.
- [x] **3.2** Crear `AuthStore` reactivo basado en Angular Signals (`signal()`, `computed()`) con hidratación segura.
- [x] **3.3** Implementar `AuthInterceptor` funcional para inyección de token JWT y manejo de 401.
- [x] **3.4** Construir Layout maestro: `NavbarComponent` con usuario/rol/status, `SidebarComponent` colapsable responsivo y `MainLayoutComponent` con `RouterOutlet`.
- [x] **3.5** Construir pantalla de Login con formulario reactivo, validaciones visuales, loading spinner y 1-click Quick Demo logins (Admin, Operador, Auditor).
- [x] **3.6** Implementar Guards de rutas funcionales (`authGuard` y `publicGuard` con redirección por `UrlTree`).

---

## Sprint 4: Torre de Control (Grafo DAG) & Grilla de Auditoría
- [x] **4.1** Integración de `@swimlane/ngx-graph` en `apps/web`.
- [x] **4.2** Pantalla **Control Tower**: Nodos interactivos de red (Origen, Aduana/Frontera, Destino), aristas con estado de tránsito y filtrado reactivo bidireccional.
- [x] **4.3** Pantalla **Freight Cost Audit**: Matriz de 5 tramos, cálculo instantáneo de varianza, semáforos cromáticos (Verde $\le 0\%$, Ámbar $\le 5\%$, Rojo $> 5\%$) y exportación a Excel estilizado vía `ExcelJS`.

---

## Sprint 5: Bitácora de 3 Niveles & Centro de Alertas SLA
- [x] **5.1** Pantalla **Alert Center**: Tarjetas de KPI (Total, Alta, Media, Baja), contadores de SLA en tiempo real (`DD:HH:MM`), sumatoria de impacto financiero en USD y modal de resolución con justificación requerida.
- [x] **5.2** Componente **Bitácora Colaborativa**: Visualización en árbol indentado de 3 niveles (*Nota Principal $\rightarrow$ Réplica $\rightarrow$ Subcomentario*), carga de evidencias y timestampting reactivo.

---

## Sprint 6: Testing E2E (Playwright) & Dockerización
- [x] **6.1** Inicializar Playwright en `e2e/` con configuración Chromium, screenshots y timeouts.
- [x] **6.2** Test E2E 1: Flujo completo de Autenticación y control de accesos (`e2e/auth.spec.ts`).
- [x] **6.3** Test E2E 2: Visualización de Grafo DAG, filtrado reactivo y ciclo de "Nueva Reserva" (`e2e/control-tower.spec.ts`).
- [x] **6.4** Test E2E 3: Auditoría de costos con 5 tramos, descarga Excel y Alertas SLA con resolución (`e2e/freight-audit.spec.ts`, `e2e/alerts.spec.ts`).
- [x] **6.5** Test E2E 4: Bitácora colaborativa en 3 niveles con aislamiento por envío (`e2e/collaboration.spec.ts`).
- [x] **6.6** `Dockerfile` multi-stage para NestJS (`apps/api/Dockerfile`) con Node 20 y Prisma.
- [x] **6.7** `Dockerfile` multi-stage con Nginx para Angular 21 (`apps/web/Dockerfile`, `apps/web/nginx.conf`).
- [x] **6.8** `docker-compose.yml` para orquestar PostgreSQL 16 Alpine, API y Web con healthchecks.

---

## Sprint 7: CI/CD, Despliegue Público & Publicación en GitHub
- [x] **7.1** Pipeline de GitHub Actions en `.github/workflows/ci.yml` (Lint, Build, Playwright headless).
- [x] **7.2** Despliegue de API y Base de Datos (Render / Supabase / Railway).
- [x] **7.3** Despliegue de Frontend (Vercel / Netlify).
- [x] **7.4** `README.md` maestro en inglés con badges, arquitectura Mermaid, capturas de pantalla y guía de inicio rápido.
- [x] **7.5** Publicación del repositorio público en GitHub y vinculación en perfil profesional.
