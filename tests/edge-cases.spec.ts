import { test, expect } from '../fixtures/test-base';

/**
 * Suite: Edge Cases & Error Validation tests
 * Verifies the application behavior under edge cases and error responses, 
 * including Shorts URLs, invalid URL structures, and various backend API failures.
 */
test.describe('Edge Cases & Error Validation tests', () => {
  // Navigate to landing page before each test case
  test.beforeEach(async ({ landingPage }) => {
    await landingPage.goto();
  });

  /**
   * Test Scenario: Accept YouTube Shorts format URL and trigger summarize process.
   * Steps:
   * 1. Define a valid YouTube Shorts URL format (`/shorts/{id}`).
   * 2. Mock a successful API response (HTTP 200) for the summarize request.
   * 3. Input and submit the Shorts URL.
   * 4. Verify the results container becomes visible.
   * 5. Verify the generated summary markdown contains the mocked text.
   */
  test('should accept YouTube Shorts format URL and trigger summarize process', async ({ landingPage }) => {
    const videoId = 'pgKg6jb7_5M';
    const shortsUrl = `https://www.youtube.com/shorts/${videoId}`;

    await landingPage.page.route('**/api/summarize', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          videoId,
          summary: '### Shorts Summary\n- **Point 1**: High speed content.',
          transcript: '[00:00] Shorts start',
          thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
        })
      });
    });

    await landingPage.submitVideoUrl(shortsUrl);
    await expect(landingPage.resultContainer).toBeVisible();
    await expect(landingPage.summaryContent).toContainText('Shorts Summary');
  });

  /**
   * Test Scenario: Display validation error for non-youtube URL (HTTP 400).
   * Steps:
   * 1. Define an invalid non-YouTube URL (`https://google.com`).
   * 2. Mock an API response with HTTP 400 status.
   * 3. Submit the invalid URL.
   * 4. Verify the error message container is visible.
   * 5. Verify the localized error message is displayed (Russian or English).
   */
  test('should display validation error for non-youtube URL (HTTP 400)', async ({ landingPage }) => {
    const invalidUrl = 'https://google.com';

    await landingPage.page.route('**/api/summarize', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid YouTube URL' })
      });
    });

    await landingPage.submitVideoUrl(invalidUrl);
    await expect(landingPage.errorMessage).toBeVisible();
    await expect(landingPage.errorMessage).toContainText('Некорректная ссылка на YouTube-видео.');
  });

  /**
   * Test Scenario: Display clear error details for video with disabled subtitles (HTTP 502).
   * Steps:
   * 1. Define a YouTube video URL where subtitles are disabled/unavailable.
   * 2. Mock an API response with HTTP 502 status and specific transcript error details.
   * 3. Submit the URL.
   * 4. Verify the error message container is visible.
   * 5. Verify that the correct API-provided error text is displayed.
   */
  test('should display clear error details for video with disabled subtitles (HTTP 502)', async ({ landingPage }) => {
    const noSubsUrl = 'https://www.youtube.com/watch?v=noSubtitles';

    await landingPage.page.route('**/api/summarize', async (route) => {
      await route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Could not fetch transcript. Video may have no subtitles.' })
      });
    });

    await landingPage.submitVideoUrl(noSubsUrl);
    await expect(landingPage.errorMessage).toBeVisible();
    await expect(landingPage.errorMessage).toContainText('Could not fetch transcript. Video may have no subtitles.');
  });

  /**
   * Test Scenario: Display warning for non-existent video IDs (HTTP 502).
   * Steps:
   * 1. Define a non-existent YouTube video URL.
   * 2. Mock an API response with HTTP 502 status indicating a transcription fetch error.
   * 3. Submit the URL.
   * 4. Verify the error message container is visible.
   * 5. Verify the error content matches the general transcription unavailability pattern.
   */
  test('should display warning for non-existent video IDs (HTTP 502)', async ({ landingPage }) => {
    const nonExistentUrl = 'https://www.youtube.com/watch?v=nonexistent';

    await landingPage.page.route('**/api/summarize', async (route) => {
      await route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Could not fetch transcript: Subtitles disabled or unavailable' })
      });
    });

    await landingPage.submitVideoUrl(nonExistentUrl);
    await expect(landingPage.errorMessage).toBeVisible();
    await expect(landingPage.errorMessage).toContainText('Could not fetch transcript');
  });
});

