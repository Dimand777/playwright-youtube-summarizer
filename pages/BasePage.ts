import { Page, Locator } from '@playwright/test';

export class BasePage {
  readonly page: Page;
  readonly logoLink: Locator;
  readonly loginLink: Locator;
  readonly logoutButton: Locator;
  readonly dashboardLink: Locator;
  readonly donateButton: Locator;
  readonly langSwitchRu: Locator;
  readonly langSwitchEn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.logoLink = page.locator('header a').first();
    this.loginLink = page.locator('header').getByRole('link', { name: /Войти|Sign In/i });
    this.logoutButton = page.locator('header').getByRole('button', { name: /Выйти|Log Out/i });
    this.dashboardLink = page.locator('header').getByRole('link', { name: /Панель|Dashboard/i });
    this.donateButton = page.locator('header').getByRole('button', { name: /💝 Поддержать|💝 Support/i });
    this.langSwitchRu = page.locator('header').getByRole('link', { name: 'RU', exact: true });
    this.langSwitchEn = page.locator('header').getByRole('link', { name: 'EN', exact: true });
  }

  async switchLanguage(lang: 'ru' | 'en') {
    if (lang === 'ru') {
      await this.langSwitchRu.click();
    } else {
      await this.langSwitchEn.click();
    }
  }
}
