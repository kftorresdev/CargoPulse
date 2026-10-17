import { expect, Page } from '@playwright/test';

/**
 * Reusable Authentication and Session Test Helpers for CargoPulse E2E
 */

export const DEMO_USERS = {
  admin: {
    email: 'admin@cargopulse.com',
    password: 'Password123!',
    role: 'ADMIN',
    name: 'Kevin Torres',
    initials: 'KT',
    roleLabelRegex: /admin/i,
  },
  operator: {
    email: 'operator@cargopulse.com',
    password: 'Password123!',
    role: 'LOGISTICS_OPERATOR',
    name: 'Carlos Mendoza',
    initials: 'CM',
    roleLabelRegex: /operador|operator/i,
  },
  auditor: {
    email: 'auditor@cargopulse.com',
    password: 'Password123!',
    role: 'FREIGHT_AUDITOR',
    name: 'Elena Rivas',
    initials: 'ER',
    roleLabelRegex: /auditor/i,
  },
};

/**
 * Logs in as Administrator using quick-login demo button or fallback credentials.
 * Asserts redirect to /control-tower and checks role badge in navbar.
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  const testIdBtn = page.locator('[data-testid="quick-login-admin"]');
  const textBtn = page.locator('button', { hasText: DEMO_USERS.admin.email });

  if (await testIdBtn.count() > 0 && await testIdBtn.first().isVisible()) {
    await testIdBtn.first().click();
  } else if (await textBtn.count() > 0 && await textBtn.first().isVisible()) {
    await textBtn.first().click();
  } else {
    await page.fill('#email', DEMO_USERS.admin.email);
    await page.fill('#password', DEMO_USERS.admin.password);
    await page.click('button[type="submit"]');
  }

  await page.waitForURL('**/control-tower', { timeout: 20000 });
  await expect(page).toHaveURL(/\/control-tower$/);

  const navbar = page.locator('app-navbar');
  await expect(navbar).toBeVisible();
  await expect(navbar).toContainText(DEMO_USERS.admin.roleLabelRegex);
}

/**
 * Logs in as Logistics Operator using quick-login demo button or credentials.
 * Asserts redirect to /control-tower and checks role badge in navbar.
 */
export async function loginAsOperator(page: Page): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  const testIdBtn = page.locator('[data-testid="quick-login-operator"]');
  const textBtn = page.locator('button', { hasText: DEMO_USERS.operator.email });

  if (await testIdBtn.count() > 0 && await testIdBtn.first().isVisible()) {
    await testIdBtn.first().click();
  } else if (await textBtn.count() > 0 && await textBtn.first().isVisible()) {
    await textBtn.first().click();
  } else {
    await page.fill('#email', DEMO_USERS.operator.email);
    await page.fill('#password', DEMO_USERS.operator.password);
    await page.click('button[type="submit"]');
  }

  await page.waitForURL('**/control-tower', { timeout: 20000 });
  await expect(page).toHaveURL(/\/control-tower$/);

  const navbar = page.locator('app-navbar');
  await expect(navbar).toBeVisible();
  await expect(navbar).toContainText(DEMO_USERS.operator.roleLabelRegex);
}

/**
 * Logs in as Freight Auditor using quick-login demo button or credentials.
 * Asserts redirect to /control-tower and checks role badge in navbar.
 */
export async function loginAsAuditor(page: Page): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  const testIdBtn = page.locator('[data-testid="quick-login-auditor"]');
  const textBtn = page.locator('button', { hasText: DEMO_USERS.auditor.email });

  if (await testIdBtn.count() > 0 && await testIdBtn.first().isVisible()) {
    await testIdBtn.first().click();
  } else if (await textBtn.count() > 0 && await textBtn.first().isVisible()) {
    await textBtn.first().click();
  } else {
    await page.fill('#email', DEMO_USERS.auditor.email);
    await page.fill('#password', DEMO_USERS.auditor.password);
    await page.click('button[type="submit"]');
  }

  await page.waitForURL('**/control-tower', { timeout: 20000 });
  await expect(page).toHaveURL(/\/control-tower$/);

  const navbar = page.locator('app-navbar');
  await expect(navbar).toBeVisible();
  await expect(navbar).toContainText(DEMO_USERS.auditor.roleLabelRegex);
}

/**
 * Clicks sign out button and verifies clean redirection to /login.
 */
export async function logout(page: Page): Promise<void> {
  const logoutBtn = page.locator('button.sign-out-btn, [title="Cerrar Sesión"], [title="Sign Out"]').first();
  await expect(logoutBtn).toBeVisible({ timeout: 10000 });
  await logoutBtn.click();

  await page.waitForURL('**/login', { timeout: 15000 });
  await expect(page).toHaveURL(/\/login$/);
}
