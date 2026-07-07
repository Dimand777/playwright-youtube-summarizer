import { test, expect } from '../fixtures/test-base';

test.describe('Edge Cases & Error Validation tests', () => {
  test.beforeEach(async ({ landingPage }) => {
    await landingPage.goto();
  });

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
