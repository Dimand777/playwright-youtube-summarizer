# 🎭 Playwright E2E Test Automation Framework for AI YouTube Summarizer

This repository contains a professional test automation framework for E2E testing of the **AI YouTube Summarizer** web application ([Production Website](https://ai-youtube-summarizer-zdia.vercel.app/)).

The source code for the target web application is located in a sibling repository: [ai-youtube-summarizer](https://github.com/Dimand777/ai-youtube-summarizer).

---

## 🛠️ Technology Stack
- **Language**: TypeScript
- **Test Runner**: Playwright
- **CI/CD**: Jenkins Pipeline (`Jenkinsfile`), GitHub Actions
- **Containerization**: Docker
- **Reporting**: Playwright HTML Reporter + Jenkins HTML Publisher Plugin

---

## 🏗️ Architectural Patterns

- **Page Object Model (POM)**: Kept in the `pages/` directory to separate UI locator and page-level action mappings from spec files.
- **Custom Fixtures**: Declared in `fixtures/test-base.ts` to automatically instantiate pages and handle session authentication using Playwright's `storageState` flow.
- **API Mocking & Interception**: Submissions to `POST /api/summarize` and `GET /api/files` are intercepted via Playwright `page.route()` to verify positive, validation, and negative mock states (200, 400, 502) without hitting external rate limits.
- **Dynamic Localization Verification**: UI text matches are dynamically asserted against a localized translations dictionary dictionary in `lib/i18n.ts` instead of hardcoding strings in assertions.

---

## 🚀 Running Locally

1. **Install dependencies and browsers**:
   ```bash
   npm install
   npx playwright install --with-deps
   ```

2. **Configure environment**:
   Create a `.env` file in the root directory:
   ```env
   BASE_URL=https://ai-youtube-summarizer-zdia.vercel.app
   TEST_USER_EMAIL=user@example.com
   TEST_USER_PASSWORD=securepassword
   ```

3. **Run tests**:
   ```bash
   npx playwright test          # Run all tests in headless mode
   npx playwright test --ui     # Launch Interactive UI Runner
   npx playwright test --headed # Run tests in headed browser mode
   npx playwright show-report   # Open Playwright HTML Report
   ```

---

## 🐳 Running inside Docker

Run tests inside isolated Linux containers to reproduce identical environments locally:
```bash
# Build the Docker image
docker build -t playwright-tests .

# Run tests and export report artifacts
docker run --rm -v $(pwd)/playwright-report:/app/playwright-report playwright-tests
```

---

## ⚙️ CI/CD Pipelines

- **Jenkins**: Runs Playwright tests inside Docker and uses `System.setProperty("hudson.model.DirectoryBrowserSupport.CSP", "")` to bypass strict browser CSP limits, rendering interactive reports directly in Jenkins build dashboards.
- **GitHub Actions**: Pipeline triggered on push or Pull Requests to `main`, saving HTML reports as ZIP artifacts.
