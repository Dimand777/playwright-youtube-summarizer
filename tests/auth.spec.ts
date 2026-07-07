import { test, expect } from '../fixtures/test-base';

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('should display validation error message with invalid credentials', async ({ loginPage }) => {
    // Fill credentials and submit
    await loginPage.login('invalid-user@example.com', 'wrongpassword');
    
    // Check error message is displayed
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText(/Неверный email или пароль|Invalid login credentials/i);
  });

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
