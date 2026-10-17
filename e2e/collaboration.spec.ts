import { test, expect, Page } from '@playwright/test';

test.use({ baseURL: 'http://localhost:4200' });

async function ensureEnglish(page: Page) {
  const enBtn = page.locator('button.lang-btn-en').first();
  if (await enBtn.isVisible()) {
    const isEn = await enBtn.evaluate((el) => el.classList.contains('bg-blue-600'));
    if (!isEn) {
      await enBtn.click();
      await page.waitForTimeout(300);
    }
  }
}

test.describe('3-Level Collaborative Bitácora Suite', () => {
  test('Collaborative Bitácora: Isolation, 3-Level Threading & Depth Limit Enforcement', async ({ page }) => {
    // 1. Login as Admin or Operator
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    await ensureEnglish(page);

    await page.fill('#email', 'admin@cargopulse.com');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');

    // Wait for redirect away from login
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

    // 2. Navigate to /shipments
    await page.goto('/shipments');
    await page.waitForLoadState('networkidle');

    await ensureEnglish(page);

    // 3. Isolation Check:
    // Find shipment-mxus-002 (CP-MXUS-2026-002: Monterrey Assembly to Chicago Depot)
    const targetShipmentRow = page.locator('tr[data-testid="shipment-row"]', {
      hasText: 'CP-MXUS-2026-002',
    });
    await expect(targetShipmentRow).toBeVisible();

    // Click "Ver bitácora" / "View Notes Tree"
    const openNotesBtn = targetShipmentRow.locator('[data-testid="open-notes-btn"]');
    await openNotesBtn.click();

    // Verify the drawer opens
    const notesPanel = page.locator('[data-testid="notes-tree-panel"]');
    await expect(notesPanel).toBeVisible();

    // Verify header details: CP-MXUS-2026-002, BNSF Railway, Monterrey Assembly, MX -> Chicago Depot, US
    await expect(notesPanel).toContainText('CP-MXUS-2026-002');
    await expect(notesPanel.locator('[data-testid="drawer-carrier-name"]')).toHaveText('BNSF Railway');
    await expect(notesPanel).toContainText(/Monterrey Assembly,\s*MX/);
    await expect(notesPanel).toContainText(/Chicago Depot,\s*US/);

    // If no notes exist yet, verify empty state card is displayed
    const emptyNotesCard = notesPanel.locator('[data-testid="empty-notes-card"]');
    const existingL1 = notesPanel.locator('[data-testid="level-1-node"]');
    if (await existingL1.count() === 0) {
      await expect(emptyNotesCard).toBeVisible();
    }

    // 4. 3-Level Thread Creation:
    // Level 1: Click "Nueva Nota Principal" / "New Root Note"
    const addRootBtn = notesPanel.locator('[data-testid="add-root-note-btn"]');
    await addRootBtn.click();

    const noteComposer = notesPanel.locator('[data-testid="note-composer"]');
    await expect(noteComposer).toBeVisible();

    const noteInput = notesPanel.locator('[data-testid="note-content-input"]');
    const postNoteBtn = notesPanel.locator('[data-testid="post-note-btn"]');

    const l1Content = 'E2E Level 1: Master Bill of Lading received from carrier dispatch.';
    await noteInput.fill(l1Content);
    await postNoteBtn.click();

    // Verify it appears as a Level 1 card
    const level1Card = notesPanel.locator('[data-testid="level-1-node"]', {
      hasText: l1Content,
    }).first();
    await expect(level1Card).toBeVisible();

    // Level 2: Click "Responder" on that Level 1 card
    const l1ReplyBtn = level1Card.locator('[data-testid="reply-btn"]').first();
    await l1ReplyBtn.click();

    await expect(noteComposer).toBeVisible();
    const l2Content = 'E2E Level 2: Customs broker notified for border filing.';
    await noteInput.fill(l2Content);
    await postNoteBtn.click();

    // Verify it renders nested under Level 1 as Level 2 card
    const level2Card = level1Card.locator('[data-testid="level-2-node"]', {
      hasText: l2Content,
    }).first();
    await expect(level2Card).toBeVisible();

    // Level 3: Click "Responder" on that Level 2 card
    const l2ReplyBtn = level2Card.locator('[data-testid="reply-btn"]').first();
    await l2ReplyBtn.click();

    await expect(noteComposer).toBeVisible();
    const l3Content = 'E2E Level 3: Telemetry sensor attached to refrigerated container.';
    await noteInput.fill(l3Content);
    await postNoteBtn.click();

    // Verify it renders nested under Level 2 as Level 3 card
    const level3Card = level2Card.locator('[data-testid="level-3-node"]', {
      hasText: l3Content,
    }).first();
    await expect(level3Card).toBeVisible();

    // 5. 3-Level Depth Limit Check:
    // Verify that on the Level 3 card, the "Responder" button is NOT present or disabled, enforcing strict 3-level depth!
    const l3ReplyBtn = level3Card.locator('[data-testid="reply-btn"]');
    await expect(l3ReplyBtn).toHaveCount(0);

    // Verify max depth indicator is shown on Level 3 card
    await expect(level3Card).toContainText(/Maximum.*depth reached|Profundidad máxima/i);

    // 6. Close drawer and verify isolation on another shipment:
    const closeBtn = notesPanel.locator('[data-testid="close-notes-btn"]');
    await closeBtn.click();
    await expect(notesPanel).not.toBeVisible();

    // Open bitácora on another shipment (e.g. CP-2026-X9810)
    const otherShipmentRow = page.locator('tr[data-testid="shipment-row"]', {
      hasText: 'CP-2026-X9810',
    });
    await expect(otherShipmentRow).toBeVisible();
    await otherShipmentRow.locator('[data-testid="open-notes-btn"]').click();

    // Verify notes panel opened for CP-2026-X9810
    await expect(notesPanel).toBeVisible();
    await expect(notesPanel).toContainText('CP-2026-X9810');

    // Verify notes from CP-MXUS-2026-002 are NOT present (clean isolation)
    await expect(notesPanel).not.toContainText(l1Content);
    await expect(notesPanel).not.toContainText(l2Content);
    await expect(notesPanel).not.toContainText(l3Content);
  });
});
