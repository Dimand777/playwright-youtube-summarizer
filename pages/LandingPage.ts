import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LandingPage extends BasePage {
  readonly heading: Locator;
  readonly subtitle: Locator;
  readonly urlInput: Locator;
  readonly submitButton: Locator;
  readonly clearInputButton: Locator;
  readonly loadingSpinner: Locator;
  readonly loadingStageText: Locator;
  readonly errorMessage: Locator;
  readonly resultContainer: Locator;
  readonly tabSummary: Locator;
  readonly tabTranscript: Locator;
  readonly summaryContent: Locator;
  readonly transcriptContent: Locator;
  readonly copyButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator('h1');
    this.subtitle = page.locator('p.text-slate-400');
    this.urlInput = page.locator('[data-testid="youtube-url-input"]');
    this.submitButton = page.locator('[data-testid="submit-url-btn"]');
    this.clearInputButton = page.locator('form button[type="button"]');
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');
    this.loadingStageText = page.locator('[data-testid="loading-spinner"] p');
    this.errorMessage = page.locator('form p.text-red-400');
    this.resultContainer = page.locator('.animate-fadeIn').filter({ hasText: /YouTube Источник/i });
    this.tabSummary = page.locator('[role="tab"]').filter({ hasText: /САММАРИ|SUMMARY/i });
    this.tabTranscript = page.locator('[role="tab"]').filter({ hasText: /ТРАНСКРИПТ|TRANSCRIPT/i });
    this.summaryContent = page.locator('div.text-slate-300');
    this.transcriptContent = page.locator('p.whitespace-pre-wrap');
    this.copyButton = page.locator('button').filter({ hasText: /Копировать|Copy/i }).last();
  }

  async goto(path = '/') {
    await this.page.goto(path);
  }

  async submitVideoUrl(url: string) {
    await this.urlInput.fill(url);
    await this.submitButton.click();
  }
}
