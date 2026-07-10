# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication Flows >> should display validation error message with invalid credentials
- Location: tests/auth.spec.ts:22:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="login-error-message"]')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('[data-testid="login-error-message"]')

```

```yaml
- main:
  - link "RU":
    - /url: "#"
  - link "EN":
    - /url: /en/login
  - link "▶":
    - /url: /
  - heading "Вход в систему" [level=1]
  - paragraph: Войдите, чтобы сохранять историю ваших саммари и иметь к ним доступ с любого устройства.
  - text: Email
  - textbox "name@example.com" [disabled]: invalid-user@example.com
  - text: Пароль
  - textbox "••••••••" [disabled]: wrongpassword
  - button [disabled]
  - button "Нет аккаунта? Зарегистрироваться"
- alert
```

# Test source

```ts
  1  | import { test, expect } from '../fixtures/test-base';
  2  | 
  3  | /**
  4  |  * Suite: Authentication Flows
  5  |  * Verifies key authentication page interactions including form submissions, 
  6  |  * validation error states, and toggle states between Login and Sign Up.
  7  |  */
  8  | test.describe('Authentication Flows', () => {
  9  |   // Before each test in this suite, navigate to the Login page.
  10 |   test.beforeEach(async ({ loginPage }) => {
  11 |     await loginPage.goto();
  12 |   });
  13 | 
  14 |   /**
  15 |    * Test Scenario: Display validation error message with invalid credentials.
  16 |    * Steps:
  17 |    * 1. Fill in invalid user credentials (email & password) on the login form.
  18 |    * 2. Submit the login form.
  19 |    * 3. Verify that the validation error alert/message is visible.
  20 |    * 4. Verify that the error text matches localized invalid credential messages (Russian or English).
  21 |    */
  22 |   test('should display validation error message with invalid credentials', async ({ loginPage }) => {
  23 |     // Fill credentials and submit
  24 |     await loginPage.login('invalid-user@example.com', 'wrongpassword');
  25 |     
  26 |     // Check error message is displayed and matches the expected validation alert pattern
> 27 |     await expect(loginPage.errorMessage).toBeVisible();
     |                                          ^ Error: expect(locator).toBeVisible() failed
  28 |     await expect(loginPage.errorMessage).toContainText(/Неверный email или пароль|Invalid login credentials/i);
  29 |   });
  30 | 
  31 |   /**
  32 |    * Test Scenario: Toggle between Login and Registration forms.
  33 |    * Steps:
  34 |    * 1. Verify the toggle form view button is visible.
  35 |    * 2. Click the toggle button to switch the form to Sign Up mode.
  36 |    * 3. Verify the submit button text changes to reflect Registration / Sign Up.
  37 |    * 4. Click the toggle button again to switch the form back to Sign In mode.
  38 |    * 5. Verify the submit button text changes back to reflect Login / Sign In.
  39 |    */
  40 |   test('should toggle between Login and Registration forms', async ({ loginPage }) => {
  41 |     await expect(loginPage.toggleButton).toBeVisible();
  42 |     
  43 |     // Toggle to Sign Up
  44 |     await loginPage.toggleButton.click();
  45 |     await expect(loginPage.submitButton).toContainText(/Регистрация|Sign Up/i);
  46 |     
  47 |     // Toggle back to Sign In
  48 |     await loginPage.toggleButton.click();
  49 |     await expect(loginPage.submitButton).toContainText(/Войти|Sign In/i);
  50 |   });
  51 | });
  52 | 
  53 | 
```