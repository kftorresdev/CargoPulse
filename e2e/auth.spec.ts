import { test, expect } from '@playwright/test';
import {
  loginAsAdmin,
  loginAsOperator,
  loginAsAuditor,
  logout,
  DEMO_USERS,
} from './helpers/auth.helper';

test.describe('CargoPulse — Authentication & Access Control Suite', () => {
  test.beforeEach(async ({ context }) => {
    // Ensure clean storage state per test
    await context.clearCookies();
  });

  /**
   * Test 1: Load login page, verify branding CargoPulse, check language switcher (toggle ES / EN)
   * and verify translated labels change.
   */
  test('Test 1: Login page branding and language switcher toggle (ES / EN)', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // 1. Verify CargoPulse branding
    const brandHeading = page.locator('h1');
    await expect(brandHeading).toBeVisible();
    await expect(brandHeading).toContainText('Cargo');
    await expect(brandHeading).toContainText('Pulse');

    // 2. Check default Spanish (ES) labels
    const emailLabel = page.locator('label[for="email"]');
    const passwordLabel = page.locator('label[for="password"]');
    const submitBtn = page.locator('button[type="submit"]');

    await expect(emailLabel).toContainText('Correo Corporativo');
    await expect(passwordLabel).toContainText('Contraseña');
    await expect(submitBtn).toContainText('Iniciar Sesión');

    // 3. Toggle to English (EN)
    const enBtn = page.locator('.lang-btn-en, button[aria-label="English"]').first();
    await expect(enBtn).toBeVisible();
    await enBtn.click();

    // Verify translated labels changed to English
    await expect(emailLabel).toContainText('Work Email');
    await expect(passwordLabel).toContainText('Password');
    await expect(submitBtn).toContainText('Sign In');

    // 4. Toggle back to Spanish (ES)
    const esBtn = page.locator('.lang-btn-es, button[aria-label="Español"]').first();
    await expect(esBtn).toBeVisible();
    await esBtn.click();

    // Verify translated labels returned to Spanish
    await expect(emailLabel).toContainText('Correo Corporativo');
    await expect(passwordLabel).toContainText('Contraseña');
    await expect(submitBtn).toContainText('Iniciar Sesión');
  });

  /**
   * Test 2: Quick demo login as Admin ([data-testid="quick-login-admin"]),
   * verify redirect to /control-tower, verify localStorage has auth_user and access_token.
   */
  test('Test 2: Quick demo login as Admin and localStorage session verification', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Target quick login admin button via data-testid or text fallback
    const adminBtn = page.locator(
      '[data-testid="quick-login-admin"], button:has-text("admin@cargopulse.com")'
    ).first();
    await expect(adminBtn).toBeVisible();
    await adminBtn.click();

    // Verify redirection to /control-tower
    await page.waitForURL('**/control-tower', { timeout: 20000 });
    await expect(page).toHaveURL(/\/control-tower$/);

    // Verify navbar displays Admin role and initials
    const navbar = page.locator('app-navbar');
    await expect(navbar).toBeVisible();
    await expect(navbar).toContainText(DEMO_USERS.admin.roleLabelRegex);
    await expect(navbar).toContainText(DEMO_USERS.admin.initials);

    // Verify localStorage contains token and user session
    const token = await page.evaluate(
      () => localStorage.getItem('cargopulse_token') || localStorage.getItem('access_token')
    );
    const userJson = await page.evaluate(
      () => localStorage.getItem('cargopulse_user') || localStorage.getItem('auth_user')
    );

    expect(token).toBeTruthy();
    expect(userJson).toBeTruthy();

    const user = JSON.parse(userJson!);
    expect(user.role).toBe('ADMIN');
    expect(user.email).toBe(DEMO_USERS.admin.email);
  });

  /**
   * Test 3: Quick demo login as Logistics Operator and Freight Auditor.
   */
  test('Test 3: Quick demo login as Logistics Operator and Freight Auditor', async ({ page }) => {
    // 1. Login as Logistics Operator
    await loginAsOperator(page);

    // Verify role, user details and localStorage
    const opNavbar = page.locator('app-navbar');
    await expect(opNavbar).toBeVisible();
    await expect(opNavbar).toContainText(DEMO_USERS.operator.roleLabelRegex);
    await expect(opNavbar).toContainText(DEMO_USERS.operator.initials);

    const opUserJson = await page.evaluate(
      () => localStorage.getItem('cargopulse_user') || localStorage.getItem('auth_user')
    );
    expect(opUserJson).toBeTruthy();
    const opUser = JSON.parse(opUserJson!);
    expect(opUser.role).toBe('LOGISTICS_OPERATOR');
    expect(opUser.email).toBe(DEMO_USERS.operator.email);

    // Logout operator
    await logout(page);

    // 2. Login as Freight Auditor
    await loginAsAuditor(page);

    // Verify role, user details and localStorage
    const auditorNavbar = page.locator('app-navbar');
    await expect(auditorNavbar).toBeVisible();
    await expect(auditorNavbar).toContainText(DEMO_USERS.auditor.roleLabelRegex);
    await expect(auditorNavbar).toContainText(DEMO_USERS.auditor.initials);

    const auditorUserJson = await page.evaluate(
      () => localStorage.getItem('cargopulse_user') || localStorage.getItem('auth_user')
    );
    expect(auditorUserJson).toBeTruthy();
    const auditorUser = JSON.parse(auditorUserJson!);
    expect(auditorUser.role).toBe('FREIGHT_AUDITOR');
    expect(auditorUser.email).toBe(DEMO_USERS.auditor.email);

    // Logout auditor
    await logout(page);
  });

  /**
   * Test 4: Form validation with invalid credentials (e.g. unknown@user.com / WrongPass1!),
   * submit, assert that error alert/badge appears and URL stays /login.
   */
  test('Test 4: Form submission with invalid credentials shows error alert and stays on /login', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Fill invalid credentials
    await page.fill('#email', 'unknown@user.com');
    await page.fill('#password', 'WrongPass1!');

    // Submit form
    await page.click('button[type="submit"]');

    // Assert that reactive error alert banner appears
    const errorAlert = page.locator('[role="alert"]');
    await expect(errorAlert).toBeVisible({ timeout: 10000 });
    await expect(errorAlert).toContainText(/invalid|falló|error|autentic/i);

    // Assert that URL stays on /login
    await expect(page).toHaveURL(/\/login$/);
  });

  /**
   * Test 5: Protected route guard: clear localStorage/cookies,
   * attempt to navigate directly to /control-tower or /shipments, verify redirection to /login.
   */
  test('Test 5: Protected route guards redirect unauthenticated users to /login', async ({
    page,
  }) => {
    // 1. Attempt direct navigation to /control-tower
    await page.goto('/control-tower');
    await page.waitForURL('**/login', { timeout: 10000 });
    await expect(page).toHaveURL(/\/login$/);
    await page.waitForLoadState('domcontentloaded');

    // 2. Attempt direct navigation to /shipments
    await page.goto('/shipments');
    await page.waitForURL('**/login', { timeout: 10000 });
    await expect(page).toHaveURL(/\/login$/);
    await page.waitForLoadState('domcontentloaded');

    // 3. Attempt direct navigation to /freight-audit
    await page.goto('/freight-audit');
    await page.waitForURL('**/login', { timeout: 10000 });
    await expect(page).toHaveURL(/\/login$/);
    await page.waitForLoadState('domcontentloaded');
  });

  /**
   * Test 6: Successful logout returns to /login and clears session.
   */
  test('Test 6: Successful logout clears session storage and blocks protected routes', async ({
    page,
  }) => {
    // 1. Log in as Admin first
    await loginAsAdmin(page);

    // 2. Click sign out
    await logout(page);

    // 3. Verify returned to /login
    await expect(page).toHaveURL(/\/login$/);

    // 4. Verify tokens and user cleared in localStorage
    const token = await page.evaluate(
      () => localStorage.getItem('cargopulse_token') || localStorage.getItem('access_token')
    );
    const user = await page.evaluate(
      () => localStorage.getItem('cargopulse_user') || localStorage.getItem('auth_user')
    );

    expect(token).toBeNull();
    expect(user).toBeNull();

    // 5. Verify direct attempt to return to protected route is redirected to /login
    await page.goto('/control-tower');
    await page.waitForURL('**/login', { timeout: 10000 });
    await expect(page).toHaveURL(/\/login$/);
  });
});
