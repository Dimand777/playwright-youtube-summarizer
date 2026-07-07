import { test, expect } from '../fixtures/test-base';

test.describe('Dashboard and Project Files Explorer tests', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept project file tree structure
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

    // Intercept project file reading
    await page.route('**/api/files/read?path=*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: 'export function extractVideoId(url: string) { return "test-id"; }'
        })
      });
    });
  });

  test('should display file tree list, allow file selection, and render code viewer tab', async ({ page, dashboardPage }) => {
    // Navigate to dashboard
    await dashboardPage.goto();

    // Click "Files" tab
    await dashboardPage.sidebarFilesTab.click();

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
    expect(alertMessage).toContain('скопировано|copied');
  });
});
