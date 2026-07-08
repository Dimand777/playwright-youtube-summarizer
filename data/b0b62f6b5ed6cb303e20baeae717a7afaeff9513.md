# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: localization.spec.ts >> Localization Verification (RU / EN) >> should display landing page components in Russian language by default
- Location: tests/localization.spec.ts:17:7

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator: locator('[data-testid="youtube-url-input"]')
Expected: "Вставьте ссылку на YouTube видео"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toHaveAttribute" with timeout 5000ms
  - waiting for locator('[data-testid="youtube-url-input"]')

```

```yaml
- main:
  - link "▶ Summarizer":
    - /url: /
  - link "RU":
    - /url: "#"
  - link "EN":
    - /url: /en
  - button "💝 Поддержать"
  - link "Войти":
    - /url: /login
  - text: ⚡ ИИ саммаризация YouTube видео
  - heading "Получите краткую выжимку любого YouTube видео" [level=1]
  - paragraph: Вставьте ссылку на YouTube-видео ниже. Наш искусственный интеллект мгновенно проанализирует субтитры и сформирует структурированное саммари, сэкономив ваше время.
  - textbox "Вставьте ссылку на YouTube видео"
  - button "Саммаризировать →"
  - paragraph: "* Поддерживаются стандартные ссылки YouTube, укороченные youtu.be и YouTube Shorts."
  - button "💝 Пожертвовать разработчику проекта"
  - text: ⚡
  - heading "Мгновенный анализ" [level=3]
  - paragraph: Не нужно смотреть длинные видео. Извлекаем ключевую суть всего за 10-15 секунд.
  - text: 🎯
  - heading "Качественный ИИ" [level=3]
  - paragraph: Использование Google Gemini 2.5 Flash гарантирует структурированность и точность выводов.
  - text: 💾
  - heading "Сохранение истории" [level=3]
  - paragraph: Войдите в личный кабинет, чтобы хранить все свои прошлые саммари в одном месте.
  - text: © 2026 AI YouTube Summarizer. Все права защищены.
  - button "💝 Пожертвовать разработчику"
- alert
```

# Test source

```ts
  1  | import { test, expect } from '../fixtures/test-base';
  2  | import { translations } from '../lib/i18n';
  3  | 
  4  | /**
  5  |  * Suite: Localization Verification (RU / EN)
  6  |  * Tests application support for multiple locales, ensuring labels, titles, 
  7  |  * navigation links, and placeholders dynamically switch languages accurately.
  8  |  */
  9  | test.describe('Localization Verification (RU / EN)', () => {
  10 |   
  11 |   /**
  12 |    * Test Scenario: Display landing page components in Russian language by default.
  13 |    * Steps:
  14 |    * 1. Navigate to the landing page root.
  15 |    * 2. Verify header logo, headings, subtitle, placeholders, and buttons match Russian translations dictionary keys.
  16 |    */
  17 |   test('should display landing page components in Russian language by default', async ({ landingPage }) => {
  18 |     const tRu = translations.ru.landing;
  19 |     const hRu = translations.ru.header;
  20 | 
  21 |     await landingPage.goto('/');
  22 |     
  23 |     // Check header logo
  24 |     await expect(landingPage.logoLink).toContainText(hRu.logo);
  25 |     
  26 |     // Check main headings
  27 |     await expect(landingPage.heading).toContainText('Получите краткую выжимку');
  28 |     
  29 |     // Check subtitle
  30 |     await expect(landingPage.subtitle).toHaveText(tRu.subtitle);
  31 |     
  32 |     // Check input placeholder
> 33 |     await expect(landingPage.urlInput).toHaveAttribute('placeholder', tRu.inputPlaceholder);
     |                                        ^ Error: expect(locator).toHaveAttribute(expected) failed
  34 |     
  35 |     // Check submit button text
  36 |     await expect(landingPage.submitButton).toContainText(tRu.btnSummarize);
  37 |   });
  38 | 
  39 |   /**
  40 |    * Test Scenario: Dynamically translate all page elements to English on switcher click.
  41 |    * Steps:
  42 |    * 1. Navigate to the landing page root.
  43 |    * 2. Click the language switcher link/button to switch to English ('EN').
  44 |    * 3. Verify the browser URL contains the `/en` locale indicator.
  45 |    * 4. Verify that the logo, headings, subtitles, placeholders, and action buttons are translated into English.
  46 |    */
  47 |   test('should dynamically translate all page elements to English on switcher click', async ({ landingPage }) => {
  48 |     const tEn = translations.en.landing;
  49 |     const hEn = translations.en.header;
  50 | 
  51 |     await landingPage.goto('/');
  52 |     
  53 |     // Switch to English
  54 |     await landingPage.switchLanguage('en');
  55 |     
  56 |     // Check URL has /en
  57 |     await expect(landingPage.page).toHaveURL(/.*\/en/);
  58 |     
  59 |     // Check headers translate
  60 |     await expect(landingPage.logoLink).toContainText(hEn.logo);
  61 |     
  62 |     // Check main title translates
  63 |     await expect(landingPage.heading).toContainText('Get a brief summary');
  64 |     
  65 |     // Check subtitle translates
  66 |     await expect(landingPage.subtitle).toHaveText(tEn.subtitle);
  67 |     
  68 |     // Check input placeholder translates
  69 |     await expect(landingPage.urlInput).toHaveAttribute('placeholder', tEn.inputPlaceholder);
  70 |     
  71 |     // Check button translates
  72 |     await expect(landingPage.submitButton).toContainText(tEn.btnSummarize);
  73 |   });
  74 | });
  75 | 
  76 | 
```