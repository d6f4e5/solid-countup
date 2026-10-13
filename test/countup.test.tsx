import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createSignal } from 'solid-js'
import CountUp, { CountUpDefaults, type CountUpHandle } from '../src'
import {
  installFrames,
  installIO,
  installMatchMedia,
  mount,
  MockIO,
  media,
  cleanupDom,
  framesFor,
  type FrameLoop,
} from './utils'

let loop: FrameLoop

beforeEach(() => {
  installMatchMedia()
  loop = installFrames()
  installIO()
})

afterEach(cleanupDom)

/** Step used for most animations: 20 frames per second of duration. */
const STEP = 50

describe('duration 0', () => {
  it('prints the final value before start(), and start() fires start/frame/complete', () => {
    let handle!: CountUpHandle
    const onStart = vi.fn()
    const onFrame = vi.fn()
    const onComplete = vi.fn()

    const m = mount(() => (
      <CountUp
        endVal={1000}
        duration={0}
        ref={h => (handle = h)}
        onStart={onStart}
        onFrame={onFrame}
        onComplete={onComplete}
      />
    ))

    // onMount -> reset(); duration 0 means reset lands on endVal
    expect(m.text).toBe('1,000')

    handle.start()
    expect(loop.pending).toBe(1)
    loop.run(1, STEP)

    expect(m.text).toBe('1,000')
    expect(onStart).toHaveBeenCalledTimes(1)
    expect(onFrame).toHaveBeenCalledWith(1000, 1)
    expect(onComplete).toHaveBeenCalledWith(1000)
    expect(loop.pending).toBe(0)
  })
})

describe('animating', () => {
  it('counts up and lands exactly on endVal', () => {
    let handle!: CountUpHandle
    const seen: number[] = []
    const m = mount(() => (
      <CountUp endVal={1000} duration={1} useEasing={false} ref={h => (handle = h)} onFrame={v => seen.push(v)} />
    ))

    handle.start()
    loop.run(framesFor(1, STEP), STEP)

    expect(m.text).toBe('1,000')
    expect(seen.length).toBeGreaterThan(0)
    expect(seen[seen.length - 1]).toBe(1000)
  })

  it('counts down', () => {
    let handle!: CountUpHandle
    const m = mount(() => (
      <CountUp startVal={1000} endVal={0} duration={1} useEasing={false} ref={h => (handle = h)} />
    ))

    handle.start()
    loop.run(framesFor(1, STEP), STEP)

    expect(m.text).toBe('0')
  })

  it('is a no-op when startVal === endVal but still runs and completes', () => {
    let handle!: CountUpHandle
    const onComplete = vi.fn()
    const m = mount(() => (
      <CountUp startVal={500} endVal={500} duration={1} ref={h => (handle = h)} onComplete={onComplete} />
    ))

    handle.start()
    loop.run(framesFor(1, STEP), STEP)

    expect(m.text).toBe('500')
    expect(onComplete).toHaveBeenCalledWith(500)
  })

  it('never overshoots endVal with the default easing', () => {
    let handle!: CountUpHandle
    const seen: number[] = []
    const m = mount(() => (
      <CountUp endVal={1000} duration={1} ref={h => (handle = h)} onFrame={v => seen.push(v)} />
    ))

    handle.start()
    loop.run(framesFor(1, STEP), STEP)

    expect(Math.max(...seen)).toBeLessThanOrEqual(1000)
    expect(seen[seen.length - 1]).toBe(1000)
  })

  it('produces the same value at the same elapsed time on 60Hz and 120Hz', () => {
    for (const step of [1000 / 60, 1000 / 120]) {
      let handle!: CountUpHandle
      const m = mount(() => (
        <CountUp endVal={1000} duration={1} useEasing={false} ref={h => (handle = h)} />
      ))
      handle.start()

      // half of a one-second duration
      loop.run(Math.round(500 / step) + 1, step)
      expect(m.text).toBe('500')

      loop.run(Math.round(500 / step) + 2, step)
      expect(m.text).toBe('1,000')

      m.dispose()
    }
  })
})

describe('easing', () => {
  it('calls easingFn with normalised progress in [0, 1], ending at 1', () => {
    let handle!: CountUpHandle
    const args: number[] = []
    mount(() => (
      <CountUp
        endVal={1000}
        duration={1}
        easingFn={t => {
          args.push(t)
          return t
        }}
        ref={h => (handle = h)}
      />
    ))

    handle.start()
    loop.run(framesFor(1, STEP), STEP)

    expect(args.length).toBeGreaterThan(0)
    expect(args.every(t => t >= 0 && t <= 1)).toBe(true)
    expect(args[args.length - 1]).toBe(1)
  })

  it('is linear when useEasing is false', () => {
    let handle!: CountUpHandle
    const m = mount(() => (
      <CountUp endVal={1000} duration={2} useEasing={false} ref={h => (handle = h)} />
    ))

    handle.start()
    loop.run(21, STEP) // elapsed exactly 1000ms of 2000ms

    expect(m.text).toBe('500')
  })
})

describe('formatting', () => {
  const render = (props: Parameters<typeof CountUp>[0]) => mount(() => <CountUp duration={0} {...props} />)

  it('rounds to decimalPlaces and always shows that many digits', () => {
    expect(render({ endVal: 1234.567, decimalPlaces: 2 }).text).toBe('1,234.57')
    expect(render({ endVal: 1000, decimalPlaces: 2 }).text).toBe('1,000.00')
  })

  it('clamps a negative decimalPlaces instead of throwing', () => {
    const m = render({ endVal: 5, decimalPlaces: -5 })
    expect(m.text).toBe('5')
  })

  it('clamps decimalPlaces above 100 instead of throwing', () => {
    expect(() => render({ endVal: 5, decimalPlaces: 100 })).not.toThrow()
  })

  it('honours useGrouping', () => {
    expect(render({ endVal: 1234, useGrouping: false }).text).toBe('1234')
    expect(render({ endVal: 1234, useGrouping: true }).text).toBe('1,234')
  })

  it('uses custom separator and decimal characters', () => {
    expect(render({ endVal: 1234.5, decimalPlaces: 2, separator: '.', decimal: ',' }).text).toBe(
      '1.234,50',
    )
  })

  it('applies prefix and suffix', () => {
    expect(render({ endVal: 1000, prefix: '$', suffix: ' USD' }).text).toBe('$1,000 USD')
  })

  it('follows the locale for grouping', () => {
    expect(render({ endVal: 1000, locale: 'de-DE' }).text).toBe('1.000')
  })

  it('passes intlNumberFormatConfig through, with decimalPlaces winning over currency', () => {
    const text = render({
      endVal: 1000,
      intlNumberFormatConfig: { style: 'currency', currency: 'USD' },
    }).text

    // decimalPlaces (0) must win over the currency style's default 2 fraction digits
    expect(text).not.toContain('.')
    expect(text).toContain('$')
    expect(text).toContain('1,000')
  })

  it('supports compact notation', () => {
    expect(
      render({
        endVal: 1200000,
        decimalPlaces: 1,
        intlNumberFormatConfig: { notation: 'compact' },
      }).text,
    ).toBe('1.2M')
  })

  it('supports glyph substitution via numberingSystem', () => {
    expect(render({ endVal: 1000, intlNumberFormatConfig: { numberingSystem: 'deva' } }).text).toBe(
      '१,०००',
    )
  })

  it('lets formattingFn replace the output with a JSX tree', () => {
    const m = render({
      endVal: 1000,
      prefix: '$',
      suffix: 'K',
      formattingFn: (value, prefix, suffix) => (
        <b data-raw={value}>
          {prefix}
          {value}
          {suffix}
        </b>
      ),
    })

    expect(m.text).toBe('$1000K')
    expect(m.html).toContain('<b')
    expect(m.el.querySelector('b')?.getAttribute('data-raw')).toBe('1000')
  })
})

describe('accessibility', () => {
  const render = (props: Parameters<typeof CountUp>[0]) => mount(() => <CountUp duration={0} {...props} />)

  it('defaults aria-live to off', () => {
    expect(render({ endVal: 1 }).el.getAttribute('aria-live')).toBe('off')
  })

  it('lets an explicit aria-live win over the default', () => {
    expect(render({ endVal: 1, 'aria-live': 'polite' }).el.getAttribute('aria-live')).toBe('polite')
  })

  it('keeps aria-live off even when a role implies politeness', () => {
    const m = render({ endVal: 1, role: 'status' })
    expect(m.el.getAttribute('role')).toBe('status')
    expect(m.el.getAttribute('aria-live')).toBe('off')
  })

  it('spreads the remaining HTML attributes onto the span', () => {
    const m = render({ endVal: 1, class: 'stat', id: 'x', title: 'total' })
    expect(m.el.className).toBe('stat')
    expect(m.el.id).toBe('x')
    expect(m.el.getAttribute('title')).toBe('total')
  })

  it('passes hyphenated data-* attributes through from JSX', () => {
    const m = mount(() => <CountUp endVal={1} duration={0} data-testid="tile" />)
    expect(m.el.getAttribute('data-testid')).toBe('tile')
  })
})

describe('handle', () => {
  it('exposes the full control surface', () => {
    let handle!: CountUpHandle
    mount(() => <CountUp endVal={1} duration={0} ref={h => (handle = h)} />)
    expect(Object.keys(handle).sort()).toEqual(['pause', 'reset', 'resume', 'start', 'toggle', 'update'])
  })

  it('pause() freezes the value and resume() continues without jumping', () => {
    let handle!: CountUpHandle
    const m = mount(() => (
      <CountUp endVal={1000} duration={2} useEasing={false} ref={h => (handle = h)} />
    ))

    handle.start()
    loop.run(11, STEP) // 500ms of 2000ms
    const mid = m.text
    expect(mid).toBe('250')

    handle.pause()
    expect(loop.pending).toBe(0)
    loop.run(20, STEP)
    expect(m.text).toBe(mid)

    handle.resume()
    loop.run(60, STEP)
    expect(m.text).toBe('1,000')
  })

  it('toggle() pauses while running and resumes while paused', () => {
    let handle!: CountUpHandle
    mount(() => <CountUp endVal={1000} duration={1} ref={h => (handle = h)} />)

    handle.start()
    loop.run(2, STEP)
    expect(loop.pending).toBe(1)

    handle.toggle()
    expect(loop.pending).toBe(0)

    handle.toggle()
    expect(loop.pending).toBe(1)
  })

  it('reset() returns to startVal and cancels the frame loop', () => {
    let handle!: CountUpHandle
    const m = mount(() => <CountUp endVal={1000} duration={1} ref={h => (handle = h)} />)

    handle.start()
    loop.run(11, STEP)
    expect(m.text).not.toBe('0')

    handle.reset()
    expect(m.text).toBe('0')
    expect(loop.pending).toBe(0)

    loop.run(10, STEP)
    expect(m.text).toBe('0')
  })

  it('update() animates from the current position to a new target', () => {
    let handle!: CountUpHandle
    const m = mount(() => (
      <CountUp endVal={1000} duration={1} useEasing={false} ref={h => (handle = h)} />
    ))

    handle.start()
    loop.run(11, STEP) // ~500
    handle.update(2000)
    loop.run(framesFor(1, STEP) + 5, STEP)

    expect(m.text).toBe('2,000')
  })
})

describe('reactivity', () => {
  it('animates when the endVal prop changes', () => {
    const [end, setEnd] = createSignal(1000)
    const m = mount(() => <CountUp endVal={end()} duration={0.5} useEasing={false} />)

    setEnd(2000)
    loop.run(framesFor(0.5, STEP), STEP)

    expect(m.text).toBe('2,000')
  })

  it('follows decimalPlaces changes', () => {
    const [places, setPlaces] = createSignal(0)
    const m = mount(() => <CountUp endVal={1000} duration={0} decimalPlaces={places()} />)

    expect(m.text).toBe('1,000')
    setPlaces(2)
    expect(m.text).toBe('1,000.00')
  })

  it('follows locale changes', () => {
    const [locale, setLocale] = createSignal('en-US')
    const m = mount(() => <CountUp endVal={1000} duration={0} locale={locale()} />)

    expect(m.text).toBe('1,000')
    setLocale('de-DE')
    expect(m.text).toBe('1.000')
  })

  it('follows useGrouping changes', () => {
    const [grouping, setGrouping] = createSignal(true)
    const m = mount(() => <CountUp endVal={1234} duration={0} useGrouping={grouping()} />)

    expect(m.text).toBe('1,234')
    setGrouping(false)
    expect(m.text).toBe('1234')
  })

  it('follows intlNumberFormatConfig changes', () => {
    const [config, setConfig] = createSignal<Intl.NumberFormatOptions>({})
    const m = mount(() => (
      <CountUp endVal={1200000} duration={0} decimalPlaces={1} intlNumberFormatConfig={config()} />
    ))

    expect(m.text).toBe('1,200,000.0')
    setConfig({ notation: 'compact' })
    expect(m.text).toBe('1.2M')
  })
})

describe('context provider', () => {
  it('applies shared defaults', () => {
    const m = mount(() => (
      <CountUpDefaults value={{ prefix: '€', decimalPlaces: 2 }}>
        <CountUp endVal={99999} duration={0} />
      </CountUpDefaults>
    ))

    expect(m.text).toBe('€99,999.00')
  })

  it('lets an inner provider override an outer one, per value', () => {
    const m = mount(() => (
      <CountUpDefaults value={{ prefix: '€', decimalPlaces: 2 }}>
        <CountUpDefaults value={{ decimalPlaces: 0 }}>
          <CountUp endVal={99999} duration={0} />
        </CountUpDefaults>
      </CountUpDefaults>
    ))

    expect(m.text).toBe('€99,999')
  })

  it('lets direct props win over the provider', () => {
    const m = mount(() => (
      <CountUpDefaults value={{ prefix: '€', decimalPlaces: 2 }}>
        <CountUp endVal={99999} duration={0} suffix=" USD" />
      </CountUpDefaults>
    ))

    expect(m.text).toBe('€99,999.00 USD')
  })
})

describe('reduced motion', () => {
  it('jumps to the target with reducedMotion="always", without onStart or a frame', () => {
    let handle!: CountUpHandle
    const onStart = vi.fn()
    const onComplete = vi.fn()
    const m = mount(() => (
      <CountUp
        endVal={1000}
        duration={1}
        reducedMotion="always"
        ref={h => (handle = h)}
        onStart={onStart}
        onComplete={onComplete}
      />
    ))

    handle.start()

    expect(m.text).toBe('1,000')
    expect(onStart).not.toHaveBeenCalled()
    expect(onComplete).toHaveBeenCalledWith(1000)
    expect(loop.pending).toBe(0)
  })

  it('skips by default when the user prefers reduced motion', () => {
    media.reduce = true
    let handle!: CountUpHandle
    const onComplete = vi.fn()
    const m = mount(() => (
      <CountUp endVal={1000} duration={1} ref={h => (handle = h)} onComplete={onComplete} />
    ))

    handle.start()

    expect(m.text).toBe('1,000')
    expect(onComplete).toHaveBeenCalledWith(1000)
    expect(loop.pending).toBe(0)
  })

  it('animates despite the media query when reducedMotion="never"', () => {
    media.reduce = true
    let handle!: CountUpHandle
    const onStart = vi.fn()
    const onComplete = vi.fn()
    const m = mount(() => (
      <CountUp
        endVal={1000}
        duration={1}
        reducedMotion="never"
        ref={h => (handle = h)}
        onStart={onStart}
        onComplete={onComplete}
      />
    ))

    handle.start()
    expect(onStart).toHaveBeenCalledTimes(1)

    loop.run(framesFor(1, STEP), STEP)
    expect(m.text).toBe('1,000')
    expect(onComplete).toHaveBeenCalledWith(1000)
  })

  it('does not arm the observer when skipping', () => {
    media.reduce = true
    mount(() => <CountUp endVal={500} duration={1} autoAnimate />)
    expect(MockIO.instances[0]!.observed.length).toBe(0)
  })
})

describe('autoAnimate', () => {
  it('does not observe when autoAnimate is off', () => {
    mount(() => <CountUp endVal={500} duration={1} />)
    expect(MockIO.instances[0]!.observed.length).toBe(0)
  })

  it('observes the element with the given threshold', () => {
    mount(() => <CountUp endVal={500} duration={1} autoAnimate autoAnimateThreshold={0.5} />)
    const io = MockIO.instances[0]!
    expect(io.observed.length).toBe(1)
    expect(io.options?.threshold).toBe(0.5)
  })

  it('starts after the delay once it intersects, and completes', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    let handle!: CountUpHandle
    const onStart = vi.fn()
    const onComplete = vi.fn()
    const m = mount(() => (
      <CountUp
        endVal={500}
        duration={0.2}
        autoAnimate
        autoAnimateDelay={100}
        ref={h => (handle = h)}
        onStart={onStart}
        onComplete={onComplete}
      />
    ))

    const io = MockIO.instances[0]!
    io.trigger(true)
    expect(onStart).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)
    expect(onStart).toHaveBeenCalledTimes(1)

    loop.run(framesFor(0.2, STEP), STEP)
    expect(m.text).toBe('500')
    expect(onComplete).toHaveBeenCalledWith(500)
  })

  it('resets when it leaves the viewport before starting', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    let handle!: CountUpHandle
    const onStart = vi.fn()
    mount(() => (
      <CountUp endVal={500} duration={1} autoAnimate autoAnimateDelay={100} ref={h => (handle = h)} onStart={onStart} />
    ))

    const io = MockIO.instances[0]!
    io.trigger(true)
    io.trigger(false)
    vi.advanceTimersByTime(100)

    expect(onStart).not.toHaveBeenCalled()
  })

  it('only ever starts once with autoAnimateOnce', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    let handle!: CountUpHandle
    const onStart = vi.fn()
    mount(() => (
      <CountUp
        endVal={500}
        duration={0.2}
        autoAnimate
        autoAnimateOnce
        autoAnimateDelay={1}
        ref={h => (handle = h)}
        onStart={onStart}
      />
    ))

    const io = MockIO.instances[0]!
    io.trigger(true)
    vi.advanceTimersByTime(1)
    loop.run(framesFor(0.2, STEP), STEP)

    io.trigger(false)
    io.trigger(true)
    vi.advanceTimersByTime(1)

    expect(onStart).toHaveBeenCalledTimes(1)
  })
})

describe('teardown', () => {
  it('disconnects the observer and cancels the frame loop on unmount', () => {
    let handle!: CountUpHandle
    const m = mount(() => <CountUp endVal={500} duration={1} autoAnimate ref={h => (handle = h)} />)

    const io = MockIO.instances[0]!
    handle.start()
    loop.run(3, STEP)
    expect(loop.pending).toBe(1)

    m.dispose()

    expect(io.disconnected).toBe(true)
    expect(loop.pending).toBe(0)
  })
})
