import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  readonly urlInput: Locator;
  readonly submitButton: Locator;
  readonly sidebarHistoryTab: Locator;
  readonly sidebarFilesTab: Locator;
  readonly historyItems: Locator;
  readonly clearHistoryButton: Locator;
  readonly logoutSidebarButton: Locator;
  readonly userEmailLabel: Locator;
  readonly fileTreeItems: Locator;
  readonly codeViewerTab: Locator;
  readonly codeViewerPre: Locator;
  readonly copyCodeButton: Locator;
  readonly errorMessage: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    super(page);
    this.urlInput = page.locator('[data-testid="youtube-url-input"]');
    this.submitButton = page.locator('[data-testid="submit-url-btn"]');
    this.sidebarHistoryTab = page.locator('aside button').filter({ hasText: /История|History/i });
    this.sidebarFilesTab = page.locator('aside button').filter({ hasText: /Файлы проекта|Project Files/i });
    this.historyItems = page.locator('[data-testid^="history-item-"]');
    this.clearHistoryButton = page.locator('aside button').filter({ hasText: /Очистить историю|Clear History/i });
    this.logoutSidebarButton = page.locator('[data-testid="logout-btn"]');
    this.userEmailLabel = page.locator('aside p.text-gray-600');
    this.fileTreeItems = page.locator('aside button').filter({ hasText: /📄|📁/ });
    this.codeViewerTab = page.locator('[role="tab"]').filter({ hasText: /Код|Code:/i });
    this.codeViewerPre = page.locator('pre code');
    this.copyCodeButton = page.locator('button').filter({ hasText: /Копировать|Copy/i }).first();
    this.errorMessage = page.locator('[data-testid="url-error-message"]');
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');
  }

  async goto(path = '/dashboard') {
    await this.page.goto(path);
  }

  async submitVideoUrl(url: string) {
    await this.urlInput.fill(url);
    await this.submitButton.click();
  }

  async clickFileInExplorer(fileName: string) {
    await this.sidebarFilesTab.click();
    const fileButton = this.page.locator('aside button').filter({ hasText: fileName });
    await fileButton.click();
  }
}
