import { test, expect } from '../fixtures/test-base';
import { translations } from '../lib/i18n';

test.describe('Localization Verification (RU / EN)', () => {
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
