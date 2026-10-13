<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=solid-countup&background=tiles&project=%20" alt="solid-countup">
</p>

# solid-countup

[![pipeline status](https://gitlab.com/d6f4e5/solid-countup/badges/main/pipeline.svg)](https://gitlab.com/d6f4e5/solid-countup/-/pipelines)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-3178c6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![maintained with pnpm](https://img.shields.io/badge/maintained%20with-pnpm-cc00ff.svg?logo=pnpm&logoColor=white)](https://pnpm.io/)

A Solid component that animates a number from one value to another — a take on
[CountUp.js](https://github.com/inorganik/CountUp.js) 2.10.1 that renders declaratively, follows your
props reactively, and formats through `Intl.NumberFormat`.

```tsx
import CountUp from 'solid-countup'

<CountUp endVal={5234} />
```

renders `5,234`.

- [Install](#install)
- [Quick start](#quick-start)
- [What the output looks like](#what-the-output-looks-like)
- [Props](#props)
- [Control handle](#control-handle)
- [App-wide defaults](#app-wide-defaults)
- [Recipes](#recipes)
- [Server-side rendering](#server-side-rendering)
- [Accessibility](#accessibility)
- [Reduced motion](#reduced-motion)
- [Reactive `endVal`](#reactive-endval)
- [CommonJS](#commonjs)
- [Browser support](#browser-support)
- [Why not CountUp.js directly?](#why-not-countupjs-directly)
- [Contributing](#contributing)
- [License and credits](#license-and-credits)

## Install

```bash
npm install solid-countup
# or
pnpm add solid-countup
# or
yarn add solid-countup
```

`solid-js` is a peer dependency (`^1.6.0`) and is never bundled.

## Quick start

```tsx
import { render } from 'solid-js/web'
import CountUp from 'solid-countup'

render(() => <CountUp endVal={5234} />, document.body)
```

This counts up from `0` to `5,234` over 2 seconds and leaves the final value in the DOM.

## What the output looks like

Output below assumes an `en-US` runtime locale; pass `locale` to pin it. (Currency is the one that
diverges visibly — under `en-CA` the same example renders `US$1,234.50`.)

| Code | Renders |
| --- | --- |
| `<CountUp endVal={5234} />` | `5,234` |
| `<CountUp endVal={5234} duration={0} />` | `5,234` (no animation) |
| `<CountUp startVal={100} endVal={0} />` | `0` (counts down) |
| `<CountUp endVal={5234} prefix="$" suffix=" USD" />` | `$5,234 USD` |
| `<CountUp endVal={0.856} decimalPlaces={2} intlNumberFormatConfig={{ style: 'percent' }} />` | `85.60%` |
| `<CountUp endVal={1234.5} decimalPlaces={2} locale="en-US" intlNumberFormatConfig={{ style: 'currency', currency: 'USD' }} />` | `$1,234.50` |
| `<CountUp endVal={1_200_000} decimalPlaces={1} locale="en-US" intlNumberFormatConfig={{ notation: 'compact' }} />` | `1.2M` |
| `<CountUp endVal={1234567} locale="en-IN" />` | `12,34,567` (Indian grouping) |
| `<CountUp endVal={1234567} locale="hi-IN-u-nu-deva" />` | `१२,३४,५६७` (Devanagari digits) |
| `<CountUp endVal={1234567} separator=" " decimal="," />` | `1 234 567` (custom glyphs) |

## Props

`CountUp` renders a `<span>` and spreads the rest of its props onto that element, so `class`, `id`,
`style`, `role`, `aria-*` and every other `<span>` attribute work as usual.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `endVal` | `number` | — | **Required.** The target value. |
| `startVal` | `number` | `0` | The value the animation starts from. |
| `duration` | `number` | `2` | Duration in **seconds**. `0` prints the final value immediately. |
| `decimalPlaces` | `number` | `0` | Fraction digits, clamped to `0`–`100`. Drives `Intl`'s min/max fraction digits. |
| `useEasing` | `boolean` | `true` | Set `false` for a linear count. |
| `easingFn` | `(progress: number) => number` | log-scaled ease-out | Receives normalised progress in `[0, 1]` and returns eased progress. Not Penner `(t, b, c, d)`. |
| `useGrouping` | `boolean` | `true` | Thousands separators. |
| `locale` | `string` | runtime default | BCP 47 locale for `Intl.NumberFormat`. Reactive. |
| `prefix` | `string` | `''` | Literal text before the number. |
| `suffix` | `string` | `''` | Literal text after the number. |
| `separator` | `string` | locale's group char | Override the grouping glyph. |
| `decimal` | `string` | locale's decimal char | Override the decimal glyph. |
| `formattingFn` | `(value, prefix, suffix) => JSXElement` | `Intl`-based | Full output override. Receives the raw number. |
| `ref` | `(handle: CountUpHandle) => void` | — | Called with the [control handle](#control-handle). |
| `onStart` | `() => void` | — | Fires when the animation starts. |
| `onComplete` | `(endVal: number) => void` | — | Fires when the animation reaches the target. |
| `onFrame` | `(value: number, progress: number) => void` | — | Fires every frame, including the last. |
| `autoAnimate` | `boolean` | `false` | Start when scrolled into view (`IntersectionObserver`). |
| `autoAnimateThreshold` | `number` | `0` | `IntersectionObserver` threshold. |
| `autoAnimateDelay` | `number` | `200` | Milliseconds to wait after entering view before starting. |
| `autoAnimateOnce` | `boolean` | `false` | Animate only the first time it enters view. |
| `reducedMotion` | `'user' \| 'always' \| 'never'` | `'user'` | See [Reduced motion](#reduced-motion). |
| `intlNumberFormatConfig` | `Intl.NumberFormatOptions` | `{}` | Passed to the `Intl.NumberFormat` constructor. |

> `decimalPlaces`, `useGrouping` and `intlNumberFormatConfig` are assigned **after** the spread inside
> the constructor, so `decimalPlaces` wins over any `minimumFractionDigits` / `maximumFractionDigits`
> you set, and `useGrouping` wins over `intlNumberFormatConfig.useGrouping`. That is why the currency
> example above passes `decimalPlaces={2}` to get cents.

## Control handle

Pass a `ref` to receive an object with imperative controls. Every method is stable for the life of the
component.

```tsx
import { CountUp, type CountUpHandle } from 'solid-countup'

let handle: CountUpHandle | undefined

<CountUp endVal={5234} ref={h => (handle = h)} />
<button onClick={() => handle?.start()}>Start</button>
```

| Method | Description |
| --- | --- |
| `start()` | Reset and animate to `endVal`. |
| `pause()` | Stop requesting frames, holding the current value. |
| `resume()` | Continue from where it paused. |
| `toggle()` | Pause if running, resume if paused. |
| `reset()` | Return to `startVal` and cancel any pending frame or delayed start. |
| `update(value)` | Animate from the current position to a new target. |

## App-wide defaults

Wrap a subtree in `CountUpDefaults` to configure many counters at once. Values are merged with the
built-in defaults, and a prop on the individual `<CountUp>` still wins.

```tsx
import { CountUp, CountUpDefaults } from 'solid-countup'

<CountUpDefaults value={{ duration: 1.2, suffix: '%' }}>
  <div class="stats">
    <CountUp endVal={42} />
    <CountUp endVal={87} />
  </div>
</CountUpDefaults>
```

Providers nest; an inner `CountUpDefaults` merges over an outer one.

## Recipes

### Currency and percent

```tsx
<CountUp endVal={1234.5} decimalPlaces={2} locale="en-US" intlNumberFormatConfig={{ style: 'currency', currency: 'USD' }} />
// $1,234.50

<CountUp endVal={0.856} decimalPlaces={2} intlNumberFormatConfig={{ style: 'percent' }} />
// 85.60%
```

### Compact and signed numbers

```tsx
<CountUp endVal={1_200_000} decimalPlaces={1} locale="en-US" intlNumberFormatConfig={{ notation: 'compact' }} />
// 1.2M

<CountUp endVal={1234} locale="en-US" intlNumberFormatConfig={{ signDisplay: 'always' }} />
// +1,234
```

### Custom glyphs

`separator` and `decimal` override what `Intl` produces, without changing the locale:

```tsx
<CountUp endVal={1234567.89} decimalPlaces={2} locale="en-US" separator=" " decimal="," />
// 1 234 567,89
```

### Split digits (custom rendering)

`formattingFn` gets the raw number and returns a `JSXElement`, so you can emit any structure — one
element per digit, an odometer scaffold, a styled component:

```tsx
import { For } from 'solid-js'

<CountUp
  endVal={5234}
  formattingFn={value => (
    <span class="digits">
      <For each={new Intl.NumberFormat().format(value).split('')}>
        {char => <span class="digit">{char}</span>}
      </For>
    </span>
  )}
/>
```

> `prefix` and `suffix` live inside the default formatter, so a custom `formattingFn` replaces them
> too. Format the value yourself and prepend/append whatever you need.

## Server-side rendering

On the server the component renders the **final** value — no flash of `0`, no hydration mismatch, no
layout shift:

```tsx
import { renderToString } from 'solid-js/web'
import CountUp from 'solid-countup'

renderToString(() => <CountUp endVal={5234} />)
// '<span aria-live="off">5,234</span>'
```

Nothing touches `window`, `document`, `requestAnimationFrame`, `IntersectionObserver` or `matchMedia`
during SSR. The animation begins on the client, in `onMount`.

## Accessibility

The animated `<span>` carries `aria-live="off"`, because a live region here would queue roughly 120
announcements per second and drown out the rest of the page. `role="status"` implies
`aria-live="polite"`, so if you add one you almost certainly want to re-assert `aria-live="off"`:

```tsx
<CountUp endVal={5234} role="status" aria-live="off" />
```

`aria-live` is placed before the spread, so an explicit value from the caller always wins.

## Reduced motion

By default the component respects `prefers-reduced-motion: reduce`. When motion is skipped,
`start()`, `resume()` and `update()` jump straight to the target and fire `onComplete` — no frame is
ever scheduled, and `onStart` never fires.

```tsx
<CountUp endVal={5234} />                      // respect the OS setting ('user')
<CountUp endVal={5234} reducedMotion="always" />  // always skip the animation
<CountUp endVal={5234} reducedMotion="never" />   // always animate
```

## Reactive `endVal`

Changing `endVal` animates from the current position to the new target, with no imperative call:

```tsx
import { createSignal } from 'solid-js'

const [value, setValue] = createSignal(0)

<CountUp endVal={value()} />

setValue(5234) // animates from wherever the display currently is
```

The update fires on change only. Don't mix this with `update()` on the same instance — `update()`
moves the display off the prop value, and re-asserting the same `endVal` won't resync it.

## CommonJS

The package ships both ESM and CommonJS. Because it exposes a named `CountUp` **and** a default
export, `require` consumers need `.default` (or the named binding):

```js
const CountUp = require('solid-countup').default
// or
const { CountUp } = require('solid-countup')
```

## Browser support

Any browser with `Intl.NumberFormat` and `requestAnimationFrame`. `IntersectionObserver` is only
needed when `autoAnimate` is enabled, and `matchMedia` only for `reducedMotion: 'user'`. Internet
Explorer is not supported.

## Why not CountUp.js directly?

`solid-countup` is a reimplementation from CountUp.js's documented behaviour, not a wrapper.

| | solid-countup | CountUp.js 2.10.1 |
| --- | --- | --- |
| Usage | Declarative `<CountUp>` component | Imperative, you own the element |
| Reactivity | `endVal` is a reactive prop; shared defaults via context | Re-run `update()` yourself |
| Easing contract | `(progress: number) => number`, normalised to `[0, 1]` | Penner `(t, b, c, d)` |
| Per-frame callback | `onFrame(value, progress)` every frame | none |
| Formatting | `Intl.NumberFormat` — locale, currency, percent, compact, RTL and non-Latin digits | custom chars and regex |
| Reduced motion | `prefers-reduced-motion` respected by default | opt-in |
| Teardown | automatic on unmount | manual |
| SSR | renders the final value | not applicable |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License and credits

[MIT](./LICENSE).

Built on the idea behind [CountUp.js](https://github.com/inorganik/CountUp.js) by
[Jamie Perkins](https://github.com/inorganik). It is an independent reimplementation from
CountUp.js's documented behaviour, not a fork or a wrapper, and it borrows option names only where
they fit — the animation model, easing contract, formatting and several defaults are this project's
own. See [Why not CountUp.js directly?](#why-not-countupjs-directly).
