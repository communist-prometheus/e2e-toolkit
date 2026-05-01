import type { Locator, Page, Response } from '@playwright/test'
import { type WaitOptions, waitForCondition } from './wait-for'

/**
 * Navigate and return as soon as the request graph has settled.
 * Mirrors `page.goto` but never falls back to `networkidle` — that
 * heuristic is buggy on SSR sites and adds 500 ms minimum even when
 * nothing fetches. The wait-for-condition primitive resolves on the
 * first poll where DOM is ready and no new request has fired.
 * @param page Page.
 * @param url Absolute or relative URL.
 * @param options Wait tunables.
 * @returns Playwright response (forwarded from `page.goto`).
 */
export const visit = async (
  page: Page,
  url: string,
  options?: WaitOptions
): Promise<Response | null> => {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded' })
  await waitForCondition(page, async () => true, options)
  return response
}

/**
 * Click a locator and wait for the request graph triggered by the
 * click to settle. Drop-in replacement for `loc.click()` that frees
 * tests from chasing `waitForLoadState('networkidle')` afterwards.
 * @param page Page.
 * @param locator Element to click.
 * @param options Wait tunables.
 * @returns void
 */
export const click = async (
  page: Page,
  locator: Locator,
  options?: WaitOptions
): Promise<void> => {
  await locator.click()
  await waitForCondition(page, async () => true, options)
}

/**
 * Type into a form input and wait for any change-driven fetches to
 * settle.
 * @param page Page.
 * @param locator Input element.
 * @param value Value to fill.
 * @param options Wait tunables.
 * @returns void
 */
export const fill = async (
  page: Page,
  locator: Locator,
  value: string,
  options?: WaitOptions
): Promise<void> => {
  await locator.fill(value)
  await waitForCondition(page, async () => true, options)
}

/**
 * Press a key on the page (or focused element) and wait for the
 * request graph to settle.
 * @param page Page.
 * @param key Key string per Playwright's `keyboard.press` syntax.
 * @param options Wait tunables.
 * @returns void
 */
export const pressKey = async (
  page: Page,
  key: string,
  options?: WaitOptions
): Promise<void> => {
  await page.keyboard.press(key)
  await waitForCondition(page, async () => true, options)
}
