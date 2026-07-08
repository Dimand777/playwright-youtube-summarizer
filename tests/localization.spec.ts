import { test, expect } from '../fixtures/test-base';
import { translations } from '../lib/i18n';

/**
 * Suite: Localization Verification (RU / EN)
 * Tests application support for multiple locales, ensuring labels, titles, 
 * navigation links, and placeholders dynamically switch languages accurately.
 */
test.describe('Localization Verification (RU / EN)', () => {
  
  /**
   * Test Scenario: Display landing page components in Russian language by default.
   * Steps:
   * 1. Navigate to the landing page root.
   * 2. Verify header logo, headings, subtitle, placeholders, and buttons match Russian translations dictionary keys.
   */
  test('should display landing page components in Russian language by default', async ({ landingPage }) => {
    const tRu = translations.ru.landing;
    const hRu = translations.ru.header;

    await landingPage.goto('/');
    
    // Check header logo
    await expect(landingPage.logoLink).toContainText(hRu.logo);
    
    // Check main headings
    await expect(landingPage.heading).toContainText('Получите краткую выжимку');
    
    // Check subtitle
    await expect(landingPage.subtitle).toHaveText(tRu.subtitle);
    
    // Check input placeholder
    await expect(landingPage.urlInput).toHaveAttribute('placeholder', tRu.inputPlaceholder);
    
    // Check submit button text
    await expect(landingPage.submitButton).toContainText(tRu.btnSummarize);
  });

  /**
   * Test Scenario: Dynamically translate all page elements to English on switcher click.
   * Steps:
   * 1. Navigate to the landing page root.
   * 2. Click the language switcher link/button to switch to English ('EN').
   * 3. Verify the browser URL contains the `/en` locale indicator.
   * 4. Verify that the logo, headings, subtitles, placeholders, and action buttons are translated into English.
   */
  test('should dynamically translate all page elements to English on switcher click', async ({ landingPage }) => {
    const tEn = translations.en.landing;
    const hEn = translations.en.header;

    await landingPage.goto('/');
    
    // Switch to English
    await landingPage.switchLanguage('en');
    
    // Check URL has /en
    await expect(landingPage.page).toHaveURL(/.*\/en/);
    
    // Check headers translate
    await expect(landingPage.logoLink).toContainText(hEn.logo);
    
    // Check main title translates
    await expect(landingPage.heading).toContainText('Get a brief summary');
    
    // Check subtitle translates
    await expect(landingPage.subtitle).toHaveText(tEn.subtitle);
    
    // Check input placeholder translates
    await expect(landingPage.urlInput).toHaveAttribute('placeholder', tEn.inputPlaceholder);
    
    // Check button translates
    await expect(landingPage.submitButton).toContainText(tEn.btnSummarize);
  });
});

