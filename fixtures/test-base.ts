import { test as baseTest } from '@playwright/test';
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import * as fs from 'fs';
import * as path from 'path';

type TestFixtures = {
  landingPage: LandingPage;
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  authPage: PageWithSession;
};

type PageWithSession = {
  dashboard: DashboardPage;
};

export const test = baseTest.extend<TestFixtures>({
  landingPage: async ({ page }, use) => {
    await use(new LandingPage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  authPage: async ({ browser }, use) => {
    const authFile = path.resolve(__dirname, '../playwright/.auth/user.json');
    
    // Create new context with cached auth state if exists, otherwise do mock/manual login
    let context;
    if (fs.existsSync(authFile)) {
      context = await browser.newContext({ storageState: authFile });
    } else {
      context = await browser.newContext();
    }
    
    const page = await context.newPage();
    const dashboard = new DashboardPage(page);
    
    await use({ dashboard });
    
    await context.close();
  }
});

export { expect } from '@playwright/test';
