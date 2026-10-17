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

test.describe('Operational Alert Center Suite', () => {
  test('Alert Center: KPIs, Live SLA Countdowns, Filtering & Incident Resolution Flow', async ({ page }) => {
    // 1. Login as Operator or Admin
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    await ensureEnglish(page);

    await page.fill('#email', 'operator@cargopulse.com');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');

    // Wait for redirect away from login
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

    // Ensure a fresh open alert is created so tests can run repeatedly without running out of open alerts
    const token = await page.evaluate(() => localStorage.getItem('cargopulse_token'));
    if (token) {
      await page.request.post('http://localhost:3000/api/alerts', {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          shipmentId: 'a0000000-0000-4000-8000-000000000001',
          title: 'E2E Operational Inspection Hold',
          description: 'Automated test container seal verification required.',
          severity: 'CRITICAL',
          slaDeadline: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
          financialImpactUsd: 15000,
        },
      }).catch(() => {});
    }

    // 2. Navigate to /alerts (handle SPA route transition to /alert-center if needed)
    await page.goto('/alerts');
    if (!page.url().includes('alert')) {
      const alertSidebarLink = page.locator('a[routerLink="/alert-center"]');
      if (await alertSidebarLink.isVisible()) {
        await alertSidebarLink.click();
      } else {
        await page.goto('/alert-center');
      }
    }
    await page.waitForURL(/alert/);
    await page.waitForLoadState('networkidle');

    await ensureEnglish(page);

    // 3. Verify Alert KPIs (Total Alerts, P1 Critical, High Risk, Financial Impact in USD)
    // Filter bar ALL pill contains total alerts count
    const allFilterPill = page.locator('button').filter({ hasText: /All Alerts|Todas las Alertas/i }).first();
    await expect(allFilterPill).toBeVisible();

    // Critical Breaches (P1)
    const criticalKpi = page.locator('text=/Critical Breaches|Incumplimientos Críticos/i')
      .locator('xpath=ancestor::div[contains(@class, "rounded-xl")][1]');
    await expect(criticalKpi).toBeVisible();
    await expect(criticalKpi).toContainText(/\d+/);

    // High Risk (P2 / At-Risk)
    const highRiskKpi = page.locator('text=/At-Risk|SLAs en Riesgo/i')
      .locator('xpath=ancestor::div[contains(@class, "rounded-xl")][1]');
    await expect(highRiskKpi).toBeVisible();
    await expect(highRiskKpi).toContainText(/\d+/);

    // Financial Impact in USD
    const financialImpactKpi = page.locator('text=/Financial Impact|Impacto Financiero/i')
      .locator('xpath=ancestor::div[contains(@class, "rounded-xl")][1]');
    await expect(financialImpactKpi).toBeVisible();
    await expect(financialImpactKpi).toContainText(/\$[\d,]+/);
    await expect(financialImpactKpi).toContainText(/USD/);

    // 4. Verify live SLA countdown boxes
    // Live countdown contains digits formatted as HH:MM:SS or DD:HH:MM
    const countdownBoxes = page.locator('text=/\\d{1,2}:\\d{2}:\\d{2}/');
    await expect(countdownBoxes.first()).toBeVisible();
    const countdownText = (await countdownBoxes.first().innerText()).trim();
    expect(countdownText).toMatch(/\d{1,2}:\d{2}:\d{2}/);

    // 5. Test filtering: click filter pills (CRITICAL, HIGH, OPEN, RESOLVED, ALL)
    // CRITICAL filter
    const criticalFilterBtn = page.locator('button').filter({ hasText: /Critical \(P1\)|Críticas \(P1\)/i }).first();
    await criticalFilterBtn.click();
    await page.waitForTimeout(300);
    const criticalCards = page.locator('div:has(> div > h3)');
    if (await criticalCards.count() > 0) {
      await expect(page.locator('text=/P1 - CRITICAL|P1 - CRÍTICO/i').first()).toBeVisible();
    }

    // HIGH filter
    const highFilterBtn = page.locator('button').filter({ hasText: /Elevated \(P2\)|Elevadas \(P2\)/i }).first();
    await highFilterBtn.click();
    await page.waitForTimeout(300);
    const highCards = page.locator('div:has(> div > h3)');
    if (await highCards.count() > 0) {
      await expect(page.locator('text=/P2 - HIGH|P2 - ELEVADO/i').first()).toBeVisible();
    }

    // RESOLVED filter
    const resolvedFilterBtn = page.locator('button').filter({ hasText: /Resolved|Resueltas/i }).first();
    await resolvedFilterBtn.click();
    await page.waitForTimeout(300);
    const resolvedCards = page.locator('text=/Resolved Incident|Incidente Resuelto/i');
    if (await resolvedCards.count() > 0) {
      await expect(resolvedCards.first()).toBeVisible();
    }

    // OPEN filter
    const openFilterBtn = page.locator('button').filter({ hasText: /Open|Abiertas/i }).first();
    await openFilterBtn.click();
    await page.waitForTimeout(300);
    const openResolveButtons = page.locator('button').filter({ hasText: /Resolve Incident|Resolver Incidente/i });
    await expect(openResolveButtons.first()).toBeVisible();

    // ALL filter
    await allFilterPill.click();
    await page.waitForTimeout(300);

    // 6. Test Resolution Flow
    const targetResolveBtn = page.locator('button').filter({ hasText: /Resolve Incident|Resolver Incidente/i }).first();
    await expect(targetResolveBtn).toBeVisible();
    await targetResolveBtn.click();

    // Verify the resolution modal opens with details and textarea
    const modalTitle = page.locator('text=/Resolve Operational Incident|Resolver Incidente Operativo/i');
    await expect(modalTitle).toBeVisible();

    const notesTextarea = page.locator('textarea');
    await expect(notesTextarea).toBeVisible();

    // Verify confirm button is disabled when textarea is empty
    const confirmBtn = page.locator('button').filter({ hasText: /Confirm Resolution|Confirmar Resolución/i });
    await expect(confirmBtn).toBeDisabled();

    // Type resolution notes
    const resolutionNoteText = 'E2E automated verification: seal inspection verified and documented.';
    await notesTextarea.fill(resolutionNoteText);

    // Verify confirm button is now enabled
    await expect(confirmBtn).toBeEnabled();

    // Click confirm resolution
    await confirmBtn.click();

    // Verify modal closes
    await expect(modalTitle).not.toBeVisible();

    // Verify the alert status changes to RESOLVED / RESUELTO with the resolution notes rendered
    const resolvedIndicator = page.locator(`text=${resolutionNoteText}`);
    await expect(resolvedIndicator.first()).toBeVisible();
  });
});
