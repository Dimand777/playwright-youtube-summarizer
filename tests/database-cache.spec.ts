import { test, expect } from '../fixtures/test-base';

/**
 * Suite: Database Cache Verification E2E (No frontend mocking)
 * This test validates that the backend successfully returns a cached summary
 * from the Supabase database without calling Gemini or YouTube APIs, when a record exists.
 */
test.describe('Database Cache Verification E2E', () => {
  // Only run this test on chromium to prevent parallel database write race conditions
  test.skip(({ browserName }) => browserName !== 'chromium', 'Database cache test only needs to run on Chromium.');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const testVideoId = 'Gvybnseoq2A';
  const testVideoUrl = `https://www.youtube.com/watch?v=${testVideoId}`;
  
  const mockSummary = '### Тестовое саммари\n- Данные получены напрямую из кэша базы данных Supabase.';
  const mockTranscript = '[00:00] Тестовый транскрипт из базы данных.';

  // Ensure database credentials are set before running the tests
  test.beforeAll(async () => {
    if (!supabaseUrl || !supabaseKey) {
      test.skip(true, 'Supabase credentials are not defined in the environment variables. Skipping DB caching tests.');
      return;
    }

    // Clean up any stale test record from the database
    await deleteCache(testVideoId);
    
    // Insert a known cached summary to test retrieval from the DB cache
    await insertCache(testVideoId, mockSummary, mockTranscript);
  });

  // Clean up the database record after all tests in this suite
  test.afterAll(async () => {
    if (supabaseUrl && supabaseKey) {
      await deleteCache(testVideoId);
    }
  });

  test('should bypass Gemini and return cached summary directly from database', async ({ landingPage }) => {
    // Navigate to the landing page
    await landingPage.goto('/');

    // Submit the synthetic YouTube URL that corresponds to the cached video ID.
    // There are NO mock page routes set up in Playwright, so this sends a real API request.
    await landingPage.submitVideoUrl(testVideoUrl);

    // Wait for the loader and then display the results
    await expect(landingPage.resultContainer).toBeVisible({ timeout: 30000 });

    // Assert that the rendered summary matches the mock database entry
    await expect(landingPage.summaryContent).toContainText('Данные получены напрямую из кэша базы данных Supabase.');

    // Switch to Transcript tab and assert it matches the mock database transcript
    await landingPage.tabTranscript.click();
    await expect(landingPage.transcriptContent).toContainText('Тестовый транскрипт из базы данных.');
  });

  /**
   * Helper function to delete a video cache record via Supabase REST API
   */
  async function deleteCache(videoId: string) {
    const url = `${supabaseUrl}/rest/v1/summaries?video_id=eq.${videoId}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'apikey': supabaseKey!,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete cache: ${response.status} - ${response.statusText} - ${errorText}`);
    }
  }

  /**
   * Helper function to insert a video cache record via Supabase REST API
   */
  async function insertCache(videoId: string, summary: string, transcript: string) {
    const url = `${supabaseUrl}/rest/v1/summaries`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey!,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        video_id: videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        summary: summary,
        transcript: transcript,
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to insert cache: ${response.status} - ${response.statusText} - ${errorText}`);
    }
  }
});
