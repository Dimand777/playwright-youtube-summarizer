import { test, expect } from '../fixtures/test-base';

/**
 * Suite: Landing Page E2E Flow
 * Tests the core user flow on the main landing page, including URL submission,
 * redirects for guest users, and mock rendering of the AI summarization results.
 */
test.describe('Landing Page E2E Flow', () => {
  // Navigate to landing page before each test case
  test.beforeEach(async ({ landingPage }) => {
    await landingPage.goto();
  });

  /**
   * Test Scenario: Redirect unauthorized user to login page when trying to access dashboard page directly.
   * Steps:
   * 1. Navigate directly to the protected dashboard page (/dashboard).
   * 2. Verify that the browser redirects the user to the `/login` route.
   */
  test('should redirect unauthorized user to login page when trying to access dashboard page directly', async ({ landingPage }) => {
    // Attempt to access dashboard directly
    await landingPage.page.goto('/dashboard');
    
    // Should redirect to login page
    await expect(landingPage.page).toHaveURL(/.*\/login.*/);
  });

  /**
   * Test Scenario: Render skeleton loader and successfully display mock summary results.
   * Steps:
   * 1. Define a valid YouTube video URL.
   * 2. Mock a delayed or immediate API response (HTTP 200) returning video summary metadata.
   * 3. Submit the video URL.
   * 4. Assert that the loading spinner / skeleton state is displayed during the network request.
   * 5. Verify the results container and tabs are rendered.
   * 6. Check that the summary markdown matches the mocked response.
   * 7. Click on the "Transcript" tab.
   * 8. Verify the transcript content is displayed correctly.
   */
  test('should render skeleton loader and successfully display mock summary results', async ({ landingPage }) => {
    const videoId = 'pgKg6jb7_5M';
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    // Setup API intercept/mock for POST /api/summarize with a 500ms delay to verify loader visibility
    await landingPage.page.route('**/api/summarize', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 500));
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

