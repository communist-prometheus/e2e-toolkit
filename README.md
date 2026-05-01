# @prometheus/e2e-toolkit

Network-aware Playwright wrappers shared across Communist Prometheus repos.

Tests import from this package, never from `@playwright/test` directly. No blind timeouts — every wait polls a checker **and** watches the page's in-flight request graph. On a static site the wait returns on the first poll. On a dynamic SPA it absorbs the in-flight fetches without ever sleeping a hardcoded N ms.

## Why

The pattern this replaces:

```ts
await page.goto('/foo');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(500); // hope the SPA hydrated
await expect(button).toBeVisible({ timeout: 10000 });
```

Public-website's E2E suite went from **11 minutes to ~2.3 minutes** by swapping that for:

```ts
import { click, expectVisible, test, visit } from '@prometheus/e2e-toolkit';

await visit(page, '/foo');
await expectVisible(page, button);
```

## Install

```sh
bun add -d @prometheus/e2e-toolkit @playwright/test
```

Or, if you consume directly from this repo (no npm publish yet):

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@prometheus/e2e-toolkit": ["../e2e-toolkit/src/index.ts"]
    }
  }
}
```

## API

### `waitForCondition(page, checker, options?)`

The single primitive everything else is built on. Polls `checker` and resolves when both:

1. `checker()` returns `true`, **and**
2. The request graph has been quiet for `settleMs` (no in-flight requests, no recent request changes).

```ts
await waitForCondition(page, async () =>
  /\/blog/.test(page.url())
);
```

### Actions: `visit` / `click` / `fill` / `pressKey`

Drop-in replacements for `page.goto` / `loc.click()` / `loc.fill()` / `keyboard.press()`. Each finishes by waiting on the request graph.

### Assertions

`expectVisible` / `expectHidden` / `expectText` / `expectCount` / `expectMinCount` / `expectClass` / `expectAttribute` / `expectNotAttribute` / `expectValue`

Each polls a network-aware checker, then runs Playwright's standard `await expect(...)` so failure messages stay informative.

## Tunables

```ts
await waitForCondition(page, checker, {
  settleMs: 50,    // default — quiet window before resolving
  maxMs: 10_000,   // safety net; throws with the in-flight count + sample URL
  pollMs: 25,
});
```

## License

MIT.
