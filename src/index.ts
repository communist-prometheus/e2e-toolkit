/**
 * Prometheus E2E toolkit — network-aware Playwright wrappers.
 *
 * Tests import only from this barrel; they never reach into
 * `@playwright/test` directly. Every wait is built on the
 * request-graph primitive in {@link waitForCondition}, so no test
 * file ever calls `page.waitForTimeout(N)` or
 * `page.waitForLoadState('networkidle')` again.
 */

export { expect, type Locator, type Page, test } from '@playwright/test'
export { click, fill, pressKey, visit } from './actions'

export {
  expectAttribute,
  expectClass,
  expectCount,
  expectHidden,
  expectMinCount,
  expectNotAttribute,
  expectText,
  expectValue,
  expectVisible,
} from './expect'
export { type WaitOptions, waitForCondition } from './wait-for'
export { type UrlPattern, waitForUrl } from './wait-for-url'
