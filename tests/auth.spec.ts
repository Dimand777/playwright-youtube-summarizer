import { test, expect } from '../fixtures/test-base';

/**
 * Suite: Authentication Flows
 * Verifies key authentication page interactions including form submissions, 
 * validation error states, and toggle states between Login and Sign Up.
 */
test.describe('Authentication Flows', () => {
  // Before each test in this suite, navigate to the Login page.
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  /**
   * Test Scenario: Display validation error message with invalid credentials.
   * Steps:
   * 1. Fill in invalid user credentials (email & password) on the login form.
   * 2. Submit the login form.
   * 3. Verify that the validation error alert/message is visible.
   * 4. Verify that the error text matches localized invalid credential messages (Russian or English).
   */
  test('should display validation error message with invalid credentials', async ({ loginPage }) => {
    // Fill credentials and submit
    await loginPage.login('invalid-user@example.com', 'wrongpassword');
    
    // Check error message is displayed and matches the expected validation alert pattern
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText(/Неверный email или пароль|Invalid login credentials/i);
  });

  /**
   * Test Scenario: Toggle between Login and Registration forms.
   * Steps:
   * 1. Verify the toggle form view button is visible.
   * 2. Click the toggle button to switch the form to Sign Up mode.
   * 3. Verify the submit button text changes to reflect Registration / Sign Up.
   * 4. Click the toggle button again to switch the form back to Sign In mode.
   * 5. Verify the submit button text changes back to reflect Login / Sign In.
   */
  test('should toggle between Login and Registration forms', async ({ loginPage }) => {
    await expect(loginPage.toggleButton).toBeVisible();
    
    // Toggle to Sign Up
    await loginPage.toggleButton.click();
    await expect(loginPage.submitButton).toContainText(/Регистрация|Sign Up/i);
    
    // Toggle back to Sign In
    await loginPage.toggleButton.click();
    await expect(loginPage.submitButton).toContainText(/Войти|Sign In/i);
  });
});

