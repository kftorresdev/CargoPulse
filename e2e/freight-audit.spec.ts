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

test.describe('Freight Cost Audit Suite', () => {
  test('Freight Cost Audit: 5-Stage Reconciliation, KPIs, Variance Styling & Excel Export', async ({ page }) => {
    // 1. Login as Auditor or Admin
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Switch to English language if not already
    await ensureEnglish(page);

    await page.fill('#email', 'auditor@cargopulse.com');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');

    // Wait for redirect to /control-tower
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

    // 2. Navigate to /freight-audit
    await page.goto('/freight-audit');
    await page.waitForLoadState('networkidle');

    // Ensure English language on the loaded page
    await ensureEnglish(page);

    // 3. Verify summary KPIs: Total Contracted Cost, Total Actual Cost, Net Variance ($ and %), Disputed Stages count
    // Total Contracted Cost Card
    const totalContractedKpi = page.locator('text=/Total Contracted|Total Cotizado/i')
      .locator('xpath=ancestor::div[contains(@class, "rounded-xl")][1]');
    await expect(totalContractedKpi).toBeVisible();
    await expect(totalContractedKpi).toContainText(/\$[\d,]+\.\d{2}/);

    // Total Actual Cost Card
    const totalActualKpi = page.locator('text=/Total Actual|Total Facturado/i')
      .locator('xpath=ancestor::div[contains(@class, "rounded-xl")][1]');
    await expect(totalActualKpi).toBeVisible();
    await expect(totalActualKpi).toContainText(/\$[\d,]+\.\d{2}/);

    // Net Variance Card ($ and %)
    const netVarianceKpi = page.locator('text=/Net Variance|Desviación Neta/i')
      .locator('xpath=ancestor::div[contains(@class, "rounded-xl")][1]');
    await expect(netVarianceKpi).toBeVisible();
    await expect(netVarianceKpi).toContainText(/\$[\d,]+\.\d{2}/);
    await expect(netVarianceKpi).toContainText(/%/);

    // Disputed Stages count Card
    const disputedStagesKpi = page.locator('text=/Disputed Stages|Tramos en Disputa/i')
      .locator('xpath=ancestor::div[contains(@class, "rounded-xl")][1]');
    await expect(disputedStagesKpi).toBeVisible();
    await expect(disputedStagesKpi).toContainText(/\d+\s*\/\s*\d+/);

    // 4. Verify the 5-stage cards render: Origin Handling, Transit 1, Customs/Border, Transit 2, Final Destination
    const stageKeywords = [
      { name: 'Origin Handling', pattern: /Origin|Manejo en Origen|MANEJO_ORIGEN|ORIGIN_HANDLING|Arrastre de Origen/i },
      { name: 'Transit 1', pattern: /Transit 1|Tránsito.*1|TRANSIT_1/i },
      { name: 'Customs/Border', pattern: /Customs|Aduana|Fronterizo|ADUANA_FRONTERA|CUSTOMS_BORDER/i },
      { name: 'Transit 2', pattern: /Transit 2|Tránsito.*2|TRANSIT_2/i },
      { name: 'Final Destination', pattern: /Final|Destino|Última Milla|DESTINO_FINAL|FINAL_DESTINATION/i },
    ];

    for (const stage of stageKeywords) {
      await expect(page.locator(`text=${stage.pattern}`).first()).toBeVisible();
    }

    // Verify 5 visual leg cards render in the pipeline strip
    const pipelineCards = page.locator('div.grid.grid-cols-1.md\\:grid-cols-5 > div');
    await expect(pipelineCards).toHaveCount(5);

    // 5. Verify variance styling (e.g. red badge for positive variance / overrun)
    const roseBadges = page.locator('.text-rose-400, .bg-rose-500\\/10, .border-rose-500\\/30');
    await expect(roseBadges.first()).toBeVisible();

    const overrunIndicator = page.locator('text=/Cost Overrun|Sobrecosto|\\+\\d+\\.\\d+%/i');
    await expect(overrunIndicator.first()).toBeVisible();

    // 6. Test Excel Export button
    const exportButton = page.locator('button:has-text("Export Excel"), button:has-text("Exportar Excel"), button:has-text("Export")');
    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    // Verify downloaded filename matches ^freight-audit-report.*\.xlsx$
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/^freight-audit-report.*\.xlsx$/);
  });
});
