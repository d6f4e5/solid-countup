import { describe, it, expect } from 'vitest'
import { renderToString } from 'solid-js/web'
import CountUp, { CountUpDefaults } from '../src'

/**
 * Run under `--mode ssr`: JSX here (and in the component) is compiled with the
 * server transform, and `window` does not exist.
 */
const render = (view: () => unknown): string => renderToString(view as () => never)

describe('SSR', () => {
  it('renders the final value, not startVal, so there is no flash of 0', () => {
    const html = render(() => <CountUp endVal={99999} duration={2} />)
    expect(html).toContain('99,999')
  })

  it('formats with decimalPlaces and grouping', () => {
    const html = render(() => <CountUp endVal={99999} decimalPlaces={2} duration={2} />)
    expect(html).toContain('99,999.00')
  })

  it('applies prefix, suffix and locale', () => {
    expect(render(() => <CountUp endVal={1000} prefix="$" suffix=" USD" duration={2} />)).toContain(
      '$1,000 USD',
    )
    expect(render(() => <CountUp endVal={1000} locale="de-DE" duration={2} />)).toContain('1.000')
  })

  it('renders the final value even with reducedMotion="always"', () => {
    expect(render(() => <CountUp endVal={1234} duration={2} reducedMotion="always" />)).toContain(
      '1,234',
    )
  })

  it('emits aria-live="off" in the server output', () => {
    expect(render(() => <CountUp endVal={1} duration={2} />)).toContain('aria-live="off"')
  })

  it('supports a formattingFn that returns a JSX tree', () => {
    const html = render(() => (
      <CountUp
        endVal={1000}
        duration={2}
        formattingFn={value => <b>{`#${value}`}</b>}
      />
    ))
    expect(html).toContain('<b>#1000</b>')
  })

  it('applies context provider defaults', () => {
    const html = render(() => (
      <CountUpDefaults value={{ prefix: '€', decimalPlaces: 2 }}>
        <CountUp endVal={99999} duration={2} />
      </CountUpDefaults>
    ))
    expect(html).toContain('€99,999.00')
  })

  it('matches what the client shows once the animation settles', () => {
    // The seeded value IS the settled value, so hydration cannot disagree.
    const html = render(() => <CountUp endVal={1234.5} decimalPlaces={1} duration={3} />)
    expect(html).toContain('1,234.5')
  })
})
