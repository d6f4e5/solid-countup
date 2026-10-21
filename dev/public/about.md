# solid-countup

> A Solid component that animates a number from one value to another. A take on CountUp.js for
> Solid, with locale-aware formatting through `Intl.NumberFormat` and no runtime dependencies.

`solid-countup` renders a single `<span>` and animates its text content from one number to
another. It is a Solid port of [CountUp.js](https://countupjs.xyz/), with the option names and
the formatting behaviour of the original, plus reactivity that a vanilla script cannot offer.

## Install

```
pnpm add solid-countup
```

`solid-js` is a peer dependency (`^1.6.0`), not a runtime dependency, so the component always
shares the same reactive runtime as the app that uses it.

## Use it

```jsx
import CountUp from 'solid-countup'

<CountUp endVal={5234} />
```

The component renders the number as its text content and animates from `startVal` to `endVal`
over `duration` seconds.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `endVal` | `number` | required | The number to count to. |
| `startVal` | `number` | `0` | Where the animation begins. |
| `duration` | `number` | `2` | Length of the animation in seconds. `0` writes the target immediately. |
| `autoAnimate` | `boolean` | `false` | Start when the element scrolls into view, via `IntersectionObserver`. |
| `locale` | `string` | browser default | A BCP 47 locale for the number format, e.g. `hi-IN-u-nu-deva` for Devanagari digits. |
| `intlNumberFormatConfig` | `Intl.NumberFormatOptions` | `{}` | Passed straight to `Intl.NumberFormat`, so currency, percent, compact notation and signed values all work. |
| `prefix` / `suffix` | `string` | `''` | Literal text around the number, e.g. `"$"` or `" USD"`. |
| `useGrouping` | `boolean` | `true` | Group thousands. |
| `decimalPlaces` | `number` | `0` | Fixed number of fraction digits. |
| `useEasing` | `boolean` | `true` | Ease the animation instead of a constant rate. |
| `easingFn` | `(progress: number) => number` | log-scaled ease-out | Takes normalised progress and returns eased progress. |
| `reducedMotion` | `'user' \| 'always' \| 'never'` | `'user'` | When motion is reduced, the final value is written straight away. |
| `onStart` / `onFrame` / `onComplete` | callbacks | — | Start of the animation, each frame, and the end. |

Extra attributes — `class`, `id`, `role`, `aria-*` — are passed through to the rendered
`<span>`.

## Notes

- Formatting is delegated to `Intl.NumberFormat`, so currency, percentages, compact notation,
  non-Latin digits and right-to-left layouts come for free.
- On the server the component renders the **final** value, so a page never flashes `0` before
  the animation starts, and hydration cannot disagree with the server output.
- The component does not animate on mount. It holds `startVal` until you call `start()` through
  its ref, or set `autoAnimate`.

## Links

- [Live demo](https://solid-countup.d6f4e5.me/): every feature, running in the browser.
- [npm](https://www.npmjs.com/package/solid-countup): the published package.
- [Source](https://gitlab.com/d6f4e5/solid-countup): repository, issues and the full README.
