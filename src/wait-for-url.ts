import type { Page } from '@playwright/test'
import { type WaitOptions, waitForCondition } from './wait-for'

/** Pattern accepted by Playwright's `page.waitForURL`. */
export type UrlPattern = string | RegExp | ((url: URL) => boolean)

/**
 * Wait for the page URL to match `urlPattern`, then for the new
 * document to be live (DOM swapped + `readyState !== "loading"`)
 * AND the request graph to settle. Layered over Playwright's
 * `page.waitForURL` — which is navigation-event-driven and therefore
 * reliable across SPA pushState, Astro View Transitions, and hard
 * navigations.
 *
 * The document-ready check sits between the URL wait and the network
 * settle wait specifically to bridge Astro's View Transition gap:
 * `page.waitForURL` fires on the pushState that ClientRouter issues
 * BEFORE swapping documents, so a naive caller can assert against
 * the still-old DOM and either pass for the wrong reason or race the
 * swap to a transient empty state. Polling `document.readyState`
 * from within the page closes that window: once the new document is
 * mounted, `readyState` flips through `"loading" → "interactive" →
 * "complete"`. We wait for any non-`"loading"` value — that's the
 * first point at which user-facing elements are guaranteed queryable.
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
  await waitForCondition(
    page,
    async () =>
      page
        .evaluate(() => document.readyState !== 'loading')
        .catch(() => false),
    options
  )
}
