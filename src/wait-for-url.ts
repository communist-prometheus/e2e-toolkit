import type { Page } from '@playwright/test'
import { type WaitOptions, waitForCondition } from './wait-for'

/** Pattern accepted by Playwright's `page.waitForURL`. */
export type UrlPattern =
  | string
  | RegExp
  | ((url: URL) => boolean | Promise<boolean>)

/**
 * Wait for the page URL to match `urlPattern` AND the request graph
 * to settle. Layered over Playwright's `page.waitForURL` — which is
 * navigation-event-driven and therefore reliable across SPA
 * pushState, Astro View Transitions, and hard navigations — followed
 * by the toolkit's network-quiet check so callers can assert
 * against a fully-settled page immediately after.
 *
 * Use this instead of polling `page.url()` inside
 * {@link waitForCondition}: that pattern races View Transitions
 * because the test loop reads `page.url()` between Playwright's
 * navigation snapshots and may keep seeing the stale string for
 * seconds even after the new document has rendered.
 *
 * @param page Playwright page.
 * @param urlPattern Glob string, RegExp, or predicate over `URL`.
 * @param options Wait tunables forwarded to the network-quiet check.
 * @returns void; throws on Playwright's own timeout (default 30 s).
 */
export const waitForUrl = async (
  page: Page,
  urlPattern: UrlPattern,
  options?: WaitOptions
): Promise<void> => {
  await page.waitForURL(urlPattern)
  await waitForCondition(page, async () => true, options)
}
