import { test, expect } from '../fixtures/test-base';

/**
 * Suite: Dashboard and Project Files Explorer tests
 * Validates the project directory/file explorer, code editor tab rendering,
 * and copy-to-clipboard actions on the dashboard interface.
 */
test.describe('Dashboard and Project Files Explorer tests', () => {
  // Before each test, register API mocks and authenticate the user.
  test.beforeEach(async ({ page, loginPage }) => {
    // Intercept project file tree structure API request and return mock folder structure
    await page.route('**/api/files', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            name: 'src',
            type: 'directory',
            path: 'src',
            children: [
              {
                name: 'lib',
                type: 'directory',
                path: 'src/lib',
                children: [
                  {
                    name: 'youtube.ts',
                    type: 'file',
                    path: 'src/lib/youtube.ts'
                  }
                ]
              }
            ]
          }
        ])
      });
    });

    // Intercept project file reading API request for specific paths and return mock code content
    await page.route('**/api/files/read?path=*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: 'export function extractVideoId(url: string) { return "test-id"; }'
        })
      });
    });

    // Perform manual authentication
    await loginPage.goto();
    await loginPage.login('test@example.com', 'Password123!');
    
    // Ensure we are redirected to the dashboard page before proceeding
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  /**
   * Test Scenario: Display file tree list, allow file selection, and render code viewer tab.
   * Steps:
   * 1. Navigate to the dashboard page (utilizing pre-authenticated storageState if applicable).
   * 2. Click on the "Files" sidebar tab to open the explorer panel.
   * 3. Locate the mocked `youtube.ts` file item in the sidebar explorer and click it.
   * 4. Verify that the file editor tab opens, labeled with the correct filename.
   * 5. Verify the code viewer text matches the mocked content (`extractVideoId`).
   * 6. Register a Dialog event listener to catch window.alert / dialogs.
   * 7. Click the "Copy Code" button.
   * 8. Verify the dialog alert was triggered with localized success text ("скопировано" or "copied").
   */
  test('should display file tree list, allow file selection, and render code viewer tab', async ({ page, dashboardPage }) => {
    // Navigate to dashboard
    await dashboardPage.goto();

    // Click "Files" tab
    await dashboardPage.sidebarFilesTab.click();

    // Open collapsed folders: first click "src", then "lib"
    const srcFolder = page.locator('aside button').filter({ hasText: 'src' });
    await expect(srcFolder).toBeVisible();
    await srcFolder.click();

    const libFolder = page.locator('aside button').filter({ hasText: 'lib' });
    await expect(libFolder).toBeVisible();
    await libFolder.click();

    // Click mock file
    const fileButton = page.locator('aside button').filter({ hasText: 'youtube.ts' });
    await expect(fileButton).toBeVisible();
    await fileButton.click();

    // Check code viewer is active and showing code
    await expect(dashboardPage.codeViewerTab).toBeVisible();
    await expect(dashboardPage.codeViewerTab).toContainText('youtube.ts');
    await expect(dashboardPage.codeViewerPre).toContainText('extractVideoId');

    // Test alert listener on copy code
    let alertMessage = '';
    page.on('dialog', async (dialog) => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

    await dashboardPage.copyCodeButton.click();
    expect(alertMessage).toMatch(/скопировано|copied/i);
  });
});

