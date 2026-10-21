# Contributing to solid-countup

Thanks for taking the time to help. This document covers how to get the project running, what the
scripts do, and what a change needs before it can be merged.

## Prerequisites

- **Node.js** `>= 18`
- **pnpm** `>= 9` (`packageManager` is pinned to `pnpm@9.1.1`)

The repository has a single lockfile, `pnpm-lock.yaml`. Do not commit `package-lock.json` or
`yarn.lock`.

```bash
corepack enable
corepack prepare pnpm@9.1.1 --activate
```

## Setup

```bash
pnpm install
```

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Vite dev server for the demo in `dev/`. |
| `pnpm build` | Builds `dist/` with [tsup](https://tsup.egoist.dev/) (ESM + CJS + types). |
| `pnpm build:demo` | Builds the demo site from `dev/` into `dev/dist/`, server-renders it and injects the markup into `index.html` so crawlers get the content. This is what the Cloudflare Pages project runs. |
| `pnpm test` | Runs the client (jsdom) and SSR suites together. |
| `pnpm test:client` | Vitest against `test/*.test.tsx` in jsdom. |
| `pnpm test:ssr` | Vitest in `--mode ssr` against the server suite. |
| `pnpm lint` | ESLint (`--max-warnings 0`) plus `tsc --noEmit`. |
| `pnpm format` | Writes Prettier formatting. |
| `pnpm format:check` | Verifies formatting without writing. |
| `pnpm check:package` | `publint` + `arethetypeswrong --pack` against the built package. Needs `pnpm build` first. |

`check:package` inspects `dist/`, so build before running it.

## Project layout

```
src/
  index.tsx      the <CountUp> component: props, frame loop, formatting, rendering
  context.tsx    CountUpDefaults provider and the shared CountUpConfigContext
test/
  countup.test.tsx   client behaviour, on jsdom
  server.test.tsx    SSR output
  utils.tsx          test harness: fake frame loop, matchMedia, IntersectionObserver
dev/               a Vite playground used by `pnpm dev` (not published)
docs/              internal working notes (gitignored, not published)
tsup.config.ts     build configuration
.gitlab-ci.yml     the pipeline that actually runs (GitLab)
```

## Tests

Tests are written against the **rendered DOM**, not internal signals: assert on the span's
`textContent`, `innerHTML` or attributes. That keeps refactors free.

Time is not real. `test/utils.tsx` installs a frame queue that only advances when a test calls
`step()`, and `autoAnimateDelay`'s `setTimeout` is driven by `vi.useFakeTimers`. Nothing reads a wall
clock, so there are no sleeps and no flakes.

When adding a prop, add a test for its documented behaviour, and (where relevant) a test that the
component tears down cleanly on unmount.

## Before you open a merge request

- `pnpm format:check`, `pnpm lint`, `pnpm test` and `pnpm check:package` all pass.
- New public behaviour is covered by a test.
- Public API changes are reflected in `README.md`.
- The public API stays a single entry point: `<CountUp>` (plus `CountUpDefaults` and the exported
  types).

## Style

- Prettier owns formatting (`.prettierrc`) and ESLint owns lint. Run `pnpm format` before committing.
- TypeScript is strict, with `noUncheckedIndexedAccess`. Avoid `any` in public types.
- Keep changes to the public API rare and deliberate. The option set mirrors CountUp.js on purpose;
  new options are added only when they earn their keep.

## Reporting bugs and requesting features

Open an issue on the [GitLab tracker](https://gitlab.com/d6f4e5/solid-countup/-/issues). A minimal
reproduction (for example a StackBlitz) makes a fix much faster.
