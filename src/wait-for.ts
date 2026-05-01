import type { Page } from '@playwright/test'

/** Options for {@link waitForCondition}. */
export interface WaitOptions {
  /**
   * How long the condition must hold AND the request graph must stay
   * idle (no in-flight requests) before we consider the page settled.
   * 50 ms is plenty on a static site; bump it to 200–500 ms when the
   * page is genuinely dynamic.
   */
  readonly settleMs?: number
  /**
   * Hard ceiling for the entire wait, used purely as a safety net.
   * Only an actual hang (the page kept firing requests forever) ever
   * trips it; healthy pages return in milliseconds.
   */
  readonly maxMs?: number
  /**
   * Poll cadence. Lower means tighter latency at the cost of CPU.
   * 25 ms is invisible to the user and well under any RTT.
   */
  readonly pollMs?: number
}

const DEFAULT: Required<WaitOptions> = {
  settleMs: 50,
  maxMs: 10_000,
  pollMs: 25,
}

interface RequestTracker {
  readonly active: Set<string>
  lastChange: number
}

const trackers = new WeakMap<Page, RequestTracker>()

/**
 * Attach lazy listeners that count in-flight requests on a page.
 * The listeners stay attached for the page's lifetime — Playwright
 * tears them down when the page closes — so subsequent waits reuse
 * the same tracker.
 * @param page - Playwright page.
 * @returns Tracker shared across waits on the same page.
 */
const ensureTracker = (page: Page): RequestTracker => {
  const existing = trackers.get(page)
  if (existing) return existing
  const tracker: RequestTracker = { active: new Set<string>(), lastChange: 0 }
  trackers.set(page, tracker)
  page.on('request', req => {
    tracker.active.add(req.url())
    tracker.lastChange = Date.now()
  })
  page.on('response', resp => {
    tracker.active.delete(resp.url())
    tracker.lastChange = Date.now()
  })
  page.on('requestfailed', req => {
    tracker.active.delete(req.url())
    tracker.lastChange = Date.now()
  })
  return tracker
}

/**
 * Generic wait built on a request-graph listener: poll a `checker`,
 * track every in-flight request, and resolve as soon as both (1) the
 * checker returns true, AND (2) the request graph has been quiet for
 * `settleMs` (no in-flight requests, no recent request changes).
 *
 * On a static site the listener never fires, so the wait returns on
 * the first poll where the checker passes — usually <1 frame. On a
 * dynamic SPA it absorbs in-flight fetches without ever sleeping a
 * blind N ms.
 *
 * @param page - Playwright page used as the request listener source.
 * @param checker - Async predicate. MUST NOT throw — wrap risky reads in `.catch(() => false)`.
 * @param options - Tunables (rarely needed).
 * @throws Error when maxMs is hit; the message names the in-flight count + a sample stuck URL so you can find a runaway fetch.
 */
export const waitForCondition = async (
  page: Page,
  checker: () => Promise<boolean>,
  options: WaitOptions = {}
): Promise<void> => {
  const { settleMs, maxMs, pollMs } = { ...DEFAULT, ...options }
  const tracker = ensureTracker(page)
  const startedAt = Date.now()
  let metAt: number | undefined
  while (true) {
    const now = Date.now()
    if (now - startedAt > maxMs) {
      const stuck = [...tracker.active][0] ?? '(none)'
      throw new Error(
        `waitForCondition timed out after ${maxMs}ms; in-flight ${tracker.active.size}, sample ${stuck}`
      )
    }
    const met = await checker()
    if (met) {
      metAt ??= now
      const sinceMet = now - metAt
      const sinceChange = now - tracker.lastChange
      const idle = tracker.active.size === 0
      if (idle && (sinceChange >= settleMs || sinceMet >= settleMs)) {
        return
      }
    } else {
      metAt = undefined
    }
    await new Promise(resolve => globalThis.setTimeout(resolve, pollMs))
  }
}
