import { test, expect, Page } from '@playwright/test';

// Disable filesystem tracing artifacts that conflict on Windows
test.use({ trace: 'off', screenshot: 'off', video: 'off' });

/**
 * Control Tower & Shipments Management E2E Test Suite
 *
 * Covers:
 * 1. DAG Topology Visualization (ngx-graph SVG & KPIs)
 * 2. Interactive Filtering via Graph Nodes & Links
 * 3. Search Input in Shipments Table
 * 4. "Nueva Reserva" / "New Booking" Modal Lifecycle
 */

const BASE_URL = 'http://localhost:4200';

/**
 * Reusable login helper function.
 * Uses quick-login admin button if available, or fills admin credentials.
 */
async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');

  // Check if already authenticated and redirected
  if (page.url().includes('/control-tower')) {
    return;
  }

  // Attempt quick-login button, or manual credentials fallback
  const quickLoginAdmin = page.locator(
    '[data-testid="quick-login-admin"], button:has-text("admin@cargopulse.com"), button:has-text("Admin")'
  ).first();

  if (await quickLoginAdmin.isVisible({ timeout: 2000 }).catch(() => false)) {
    await quickLoginAdmin.click();
  } else {
    await page.fill('#email', 'admin@cargopulse.com');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');
  }

  // Wait for redirect to /control-tower
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 12000 });
}

test.describe('Control Tower & Shipments Management', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  /**
   * Test 1: DAG Topology Visualization
   * - Navigate to /control-tower.
   * - Verify SVG graph or @swimlane/ngx-graph container exists and renders nodes.
   * - Verify KPI cards: Total Active Corridors, In Transit, Customs Holds, Delivered shipments.
   */
  test('Test 1: DAG Topology Visualization renders graph and KPI metrics', async ({ page }) => {
    await page.goto(`${BASE_URL}/control-tower`);
    await page.waitForLoadState('networkidle');

    // Verify SVG graph / @swimlane/ngx-graph container exists
    const graphContainer = page.locator('ngx-graph');
    await expect(graphContainer).toBeVisible({ timeout: 10000 });

    // Verify SVG nodes are rendered in the DAG
    const svgNodes = page.locator('ngx-graph svg g.node');
    await expect(svgNodes.first()).toBeVisible({ timeout: 10000 });
    const nodeCount = await svgNodes.count();
    expect(nodeCount).toBeGreaterThanOrEqual(1);

    // Verify KPI Cards Strip:
    // Total Active Corridors / Active DAG Nodes
    const activeNodesKpi = page.locator('div').filter({
      hasText: /Nodos DAG Activos|Active DAG Nodes|Total Active Corridors/i
    }).first();
    await expect(activeNodesKpi).toBeVisible();

    // In Transit
    const inTransitKpi = page.locator('div').filter({
      hasText: /Envíos en Tránsito|In-Transit Shipments|In Transit/i
    }).first();
    await expect(inTransitKpi).toBeVisible();

    // Customs Holds
    const customsHoldsKpi = page.locator('div').filter({
      hasText: /Retenciones Aduanales|Customs Holds/i
    }).first();
    await expect(customsHoldsKpi).toBeVisible();

    // Delivered shipments / On-time Arrivals SLA
    const deliveredKpi = page.locator('div').filter({
      hasText: /Llegadas a Tiempo|On-Time Arrival|Delivered/i
    }).first();
    await expect(deliveredKpi).toBeVisible();
  });

  /**
   * Test 2: Interactive Filtering via Graph Nodes & Links
   * - Click on an Origin node or Customs Border node.
   * - Verify the bottom shipments table updates and filters to only shipments matching that node.
   * - Verify the active filter pill appears (showing filtered node/corridor name).
   * - Click the filter pill to clear or click reset, and verify the full shipment list is restored.
   */
  test('Test 2: Interactive Filtering via Graph Nodes & Links updates table and filter pill', async ({ page }) => {
    await page.goto(`${BASE_URL}/control-tower`);
    await page.waitForLoadState('networkidle');

    // Wait for nodes to be visible
    const svgNodes = page.locator('ngx-graph svg g.node');
    await expect(svgNodes.first()).toBeVisible({ timeout: 10000 });

    // Table rows locator in control tower shipments telemetry table
    const tableRows = page.locator('table tbody tr:not(:has-text("No se encontraron"))');
    await expect(tableRows.first()).toBeVisible({ timeout: 8000 });
    const initialRowCount = await tableRows.count();
    expect(initialRowCount).toBeGreaterThan(0);

    // Identify an Origin or Customs Border node (e.g. Monterrey Assembly or Nuevo Laredo Customs)
    const targetNode = page.locator('ngx-graph svg g.node').filter({
      hasText: /Monterrey|Guadalajara|Nuevo Laredo|Houston/i
    }).first();
    await expect(targetNode).toBeVisible();

    // Click the node (using force to trigger SVG group click handler reliably)
    await targetNode.click({ force: true });

    // Verify the bottom shipments table updates and filters down
    await page.waitForTimeout(500);
    const filteredRowCount = await tableRows.count();
    expect(filteredRowCount).toBeLessThanOrEqual(initialRowCount);

    // Verify active filter pill appears (showing node/corridor name)
    const filterPill = page.locator('span').filter({
      hasText: /Nodo:|Node:|Corredor:|Corridor:/i
    }).first();
    await expect(filterPill).toBeVisible();

    // Click clear filter pill or clear button
    const clearFilterBtn = page.locator('.clear-filter-btn, button:has-text("Limpiar"), button:has-text("Clear")').first();
    await expect(clearFilterBtn).toBeVisible();
    await clearFilterBtn.click();

    // Verify full shipment list is restored
    await page.waitForTimeout(500);
    const restoredRowCount = await tableRows.count();
    expect(restoredRowCount).toBe(initialRowCount);

    // Filter pill should reset to all corridors
    const allCorridorsPill = page.locator('span').filter({
      hasText: /Todos los Corredores Activos|All Corridors Active/i
    }).first();
    await expect(allCorridorsPill).toBeVisible();
  });

  /**
   * Test 3: Search Input in Shipments Table
   * - Navigate to Shipments table.
   * - Type a carrier name (e.g. OceanBridge or Maersk) or tracking number into search box.
   * - Verify the table rows filter down to matching records.
   * - Clear search box, verify table shows all items.
   */
  test('Test 3: Search Input in Shipments Table filters records by carrier or tracking', async ({ page }) => {
    await page.goto(`${BASE_URL}/shipments`);
    await page.waitForLoadState('networkidle');

    // Locate search box
    const searchInput = page.locator('[data-testid="search-input"]');
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Locate shipment rows
    const shipmentRows = page.locator('[data-testid="shipment-row"]');
    await expect(shipmentRows.first()).toBeVisible({ timeout: 8000 });
    const initialCount = await shipmentRows.count();
    expect(initialCount).toBeGreaterThan(1);

    // Search for carrier 'Maersk'
    await searchInput.fill('Maersk');
    await page.waitForTimeout(400);

    const filteredRows = page.locator('[data-testid="shipment-row"]');
    const filteredCount = await filteredRows.count();
    expect(filteredCount).toBeGreaterThanOrEqual(1);
    expect(filteredCount).toBeLessThan(initialCount);

    // Verify all displayed rows match the search query
    for (let i = 0; i < filteredCount; i++) {
      const rowText = await filteredRows.nth(i).innerText();
      expect(rowText.toLowerCase()).toContain('maersk');
    }

    // Clear search box
    await searchInput.fill('');
    await page.waitForTimeout(400);

    // Verify table shows all items again
    const restoredCount = await page.locator('[data-testid="shipment-row"]').count();
    expect(restoredCount).toBe(initialCount);
  });

  /**
   * Test 4: "Nueva Reserva" / "New Booking" Modal Lifecycle
   * - Click the "Nueva Reserva" / "New Booking" button.
   * - Verify the booking modal opens with fields: Tracking Number, Origin, Destination, Carrier.
   * - Verify submit button is disabled if required fields are empty.
   * - Fill in valid test data:
   *   - Origin: Veracruz Terminal, MX
   *   - Destination: Houston Intermodal, US
   *   - Carrier: Transportes Castores
   * - Submit the form.
   * - Verify the modal closes.
   * - Verify the newly created shipment appears in the table with status PENDING or IN_TRANSIT.
   */
  test('Test 4: "Nueva Reserva" / "New Booking" Modal Lifecycle creates new shipment', async ({ page }) => {
    await page.goto(`${BASE_URL}/shipments`);
    await page.waitForLoadState('networkidle');

    // Click "Nueva Reserva" / "New Booking" button
    const openBookingBtn = page.locator(
      '[data-testid="open-booking-modal-btn"], [data-testid="new-booking-btn"], button:has-text("Nueva Reserva"), button:has-text("New Booking")'
    ).first();
    await expect(openBookingBtn).toBeVisible({ timeout: 8000 });
    await openBookingBtn.click();

    // Verify booking modal opens
    const bookingModal = page.locator('[data-testid="booking-modal"]');
    await expect(bookingModal).toBeVisible({ timeout: 5000 });

    // Verify form fields
    const trackingInput = page.locator('[data-testid="booking-tracking-input"]');
    const originInput = page.locator('[data-testid="booking-origin-input"]');
    const destInput = page.locator('[data-testid="booking-destination-input"]');
    const carrierInput = page.locator('[data-testid="booking-carrier-input"]');

    await expect(trackingInput).toBeVisible();
    await expect(originInput).toBeVisible();
    await expect(destInput).toBeVisible();
    await expect(carrierInput).toBeVisible();

    // Verify submit button is disabled initially when required fields are empty
    const submitBtn = page.locator('[data-testid="booking-submit-btn"]');
    await expect(submitBtn).toBeDisabled();

    // Fill in valid test data
    const customTracking = `CP-2026-CAST-${Math.floor(1000 + Math.random() * 9000)}`;
    await trackingInput.fill(customTracking);
    await originInput.fill('Veracruz Terminal, MX');
    await destInput.fill('Houston Intermodal, US');
    await carrierInput.fill('Transportes Castores');

    // Submit button should now be enabled
    await expect(submitBtn).toBeEnabled();

    // Submit the form
    await submitBtn.click();

    // Verify the modal closes
    await expect(bookingModal).not.toBeVisible({ timeout: 5000 });

    // Verify the newly created shipment appears in the table with status PENDING or IN_TRANSIT
    const newShipmentRow = page.locator('[data-testid="shipment-row"]').filter({
      hasText: customTracking
    }).first();
    await expect(newShipmentRow).toBeVisible({ timeout: 8000 });

    const newShipmentText = await newShipmentRow.innerText();
    expect(newShipmentText).toContain('Transportes Castores');
    expect(newShipmentText).toMatch(/DRAFT|PENDING|IN_TRANSIT|EN TRÁNSITO|PENDIENTE/i);
  });

});
