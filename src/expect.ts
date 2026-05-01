import { expect, type Locator, type Page } from '@playwright/test'
import { type WaitOptions, waitForCondition } from './wait-for'

/** Common checker shape — async predicate that never throws. */
type Checker = () => Promise<boolean>

const safe =
  (checker: Checker): Checker =>
  async () =>
    checker().catch(() => false)

/**
 * Wait until `locator` is visible AND the request graph has settled,
 * then assert it. Use this in place of `await expect(loc).toBeVisible()`.
 * @param page Page (for the request graph).
 * @param locator Element to look at.
 * @param options Wait tunables.
 * @returns void
 */
export const expectVisible = async (
  page: Page,
  locator: Locator,
  options?: WaitOptions
): Promise<void> => {
  await waitForCondition(
    page,
    safe(async () => locator.isVisible()),
    options
  )
  await expect(locator).toBeVisible()
}

/**
 * Inverse of {@link expectVisible}.
 * @param page Page.
 * @param locator Element to look at.
 * @param options Wait tunables.
 * @returns void
 */
export const expectHidden = async (
  page: Page,
  locator: Locator,
  options?: WaitOptions
): Promise<void> => {
  await waitForCondition(
    page,
    safe(async () => !(await locator.isVisible())),
    options
  )
  await expect(locator).toBeHidden()
}

/**
 * Wait until the locator's text contains / matches `text`.
 * @param page Page.
 * @param locator Element to read from.
 * @param text Substring or regex.
 * @param options Wait tunables.
 * @returns void
 */
export const expectText = async (
  page: Page,
  locator: Locator,
  text: string | RegExp,
  options?: WaitOptions
): Promise<void> => {
  /*
   * Use `.first()` for the wait probe so multi-match locators don't
   * throw under strict mode and stall the wait until timeout. The
   * final `toContainText` keeps the original semantics — it tolerates
   * multi-match by checking each element.
   */
  await waitForCondition(
    page,
    safe(async () => {
      const content = (await locator.first().textContent()) ?? ''
      return typeof text === 'string'
        ? content.includes(text)
        : text.test(content)
    }),
    options
  )
  await expect(locator).toContainText(text)
}

/**
 * Wait until `locator.count()` matches `count` exactly.
 * @param page Page.
 * @param locator Element collection.
 * @param count Expected count.
 * @param options Wait tunables.
 * @returns void
 */
export const expectCount = async (
  page: Page,
  locator: Locator,
  count: number,
  options?: WaitOptions
): Promise<void> => {
  await waitForCondition(
    page,
    safe(async () => (await locator.count()) === count),
    options
  )
  expect(await locator.count()).toBe(count)
}

/**
 * Wait until `locator.count()` is at least `min`.
 * @param page Page.
 * @param locator Element collection.
 * @param min Minimum count.
 * @param options Wait tunables.
 * @returns void
 */
export const expectMinCount = async (
  page: Page,
  locator: Locator,
  min: number,
  options?: WaitOptions
): Promise<void> => {
  await waitForCondition(
    page,
    safe(async () => (await locator.count()) >= min),
    options
  )
  expect(await locator.count()).toBeGreaterThanOrEqual(min)
}

/**
 * Wait until the locator carries the requested CSS class.
 * @param page Page.
 * @param locator Element to look at.
 * @param className Substring or regex matched against the class attr.
 * @param options Wait tunables.
 * @returns void
 */
export const expectClass = async (
  page: Page,
  locator: Locator,
  className: string | RegExp,
  options?: WaitOptions
): Promise<void> => {
  await waitForCondition(
    page,
    safe(async () => {
      const cls = (await locator.getAttribute('class')) ?? ''
      return typeof className === 'string'
        ? cls.includes(className)
        : className.test(cls)
    }),
    options
  )
  await expect(locator).toHaveClass(className)
}

/**
 * Wait until the locator does NOT have the given attribute value
 * (either the attribute is absent or its value differs).
 * @param page Page.
 * @param locator Element to look at.
 * @param name Attribute name.
 * @param value Value the attribute must not equal.
 * @param options Wait tunables.
 * @returns void
 */
export const expectNotAttribute = async (
  page: Page,
  locator: Locator,
  name: string,
  value: string,
  options?: WaitOptions
): Promise<void> => {
  await waitForCondition(
    page,
    safe(async () => (await locator.getAttribute(name)) !== value),
    options
  )
  await expect(locator).not.toHaveAttribute(name, value)
}

/**
 * Wait until the locator has the given attribute value.
 * @param page Page.
 * @param locator Element to look at.
 * @param name Attribute name.
 * @param value Expected value (string equality or regex).
 * @param options Wait tunables.
 * @returns void
 */
export const expectAttribute = async (
  page: Page,
  locator: Locator,
  name: string,
  value: string | RegExp,
  options?: WaitOptions
): Promise<void> => {
  await waitForCondition(
    page,
    safe(async () => {
      const actual = (await locator.getAttribute(name)) ?? ''
      return typeof value === 'string' ? actual === value : value.test(actual)
    }),
    options
  )
  await expect(locator).toHaveAttribute(name, value)
}

/**
 * Wait until the locator has the requested input value.
 * @param page Page.
 * @param locator Form element.
 * @param value Expected value.
 * @param options Wait tunables.
 * @returns void
 */
export const expectValue = async (
  page: Page,
  locator: Locator,
  value: string,
  options?: WaitOptions
): Promise<void> => {
  await waitForCondition(
    page,
    safe(async () => (await locator.inputValue()) === value),
    options
  )
  await expect(locator).toHaveValue(value)
}
