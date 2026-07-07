import { test, expect } from '../fixtures/test-base';

test.describe('Landing Page E2E Flow', () => {
  test.beforeEach(async ({ landingPage }) => {
    await landingPage.goto();
  });

  test('should redirect unauthorized user to login page with URL query parameter on submit', async ({ landingPage }) => {
    const videoUrl = 'https://www.youtube.com/watch?v=pgKg6jb7_5M';
    await landingPage.submitVideoUrl(videoUrl);
    
    // Should redirect to login page
    await expect(landingPage.page).toHaveURL(/.*\/login\?.*/);
    const currentUrl = landingPage.page.url();
    expect(currentUrl).toContain(encodeURIComponent(videoUrl));
  });

  test('should render skeleton loader and successfully display mock summary results', async ({ landingPage }) => {
    const videoId = 'pgKg6jb7_5M';
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    // Setup API intercept/mock for POST /api/summarize
    await landingPage.page.route('**/api/summarize', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          videoId,
          summary: '### Краткое содержание\n- **Тезис 1**: Ключевой момент с таймкодом [01:15].\n- **Тезис 2**: Итоги видео [02:30].',
          transcript: '[00:00] Старт видео\n[01:15] Ключевой тезис\n[02:30] Конец видео',
          thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
        })
      });
    });

    // We can simulate an authorized session or simple landing flow mock (if no session, UI fetches directly)
    // On the SUT, HomeClient can fetch directly if userSession is not strictly forced by server component.
    // Let's perform the submit URL
    await landingPage.submitVideoUrl(videoUrl);

    // Verify loader spinner is visible
    await expect(landingPage.loadingSpinner).toBeVisible();

    // Verify result container appears and has expected summary texts
    await expect(landingPage.resultContainer).toBeVisible();
    await expect(landingPage.tabSummary).toBeVisible();
    await expect(landingPage.summaryContent).toContainText('Краткое содержание');
    
    // Toggle transcript tab and check content
    await landingPage.tabTranscript.click();
    await expect(landingPage.transcriptContent).toContainText('Старт видео');
  });
});
