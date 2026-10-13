import {
  Component,
  createSignal,
  mergeProps,
  splitProps,
  onMount,
  JSX,
  createMemo,
  onCleanup,
  useContext,
  createEffect,
  on,
  JSXElement,
} from 'solid-js'

import { CountUpConfigContext, CountUpDefaults } from './context'

// The spec allows up to 100 fraction digits, but V8 before Node 22 (and older
// browsers) limits `Intl.NumberFormat` to 20 and throws above it. Probe once so an
// out-of-range `decimalPlaces` is clamped to what this runtime actually accepts.
const MAX_FRACTION_DIGITS = (() => {
  try {
    new Intl.NumberFormat(undefined, { minimumFractionDigits: 100, maximumFractionDigits: 100 })
    return 100
  } catch {
    return 20
  }
})()

interface CountUpProps extends Omit<JSX.HTMLAttributes<HTMLSpanElement>, 'ref'> {
  startVal?: number
  // Only required prop
  endVal: number
  duration?: number
  decimalPlaces?: number
  useEasing?: boolean
  easingFn?: (value: number) => number
  useGrouping?: boolean
  locale?: string
  prefix?: string
  suffix?: string
  separator?: string
  decimal?: string
  formattingFn?: (value: number, prefix: string, suffix: string) => JSXElement
  ref?: (handle: CountUpHandle) => void
  onStart?: () => void
  onComplete?: (endVal: number) => void
  onFrame?: (value: number, progress: number) => void
  autoAnimate?: boolean
  autoAnimateThreshold?: number
  autoAnimateDelay?: number
  autoAnimateOnce?: boolean
  reducedMotion?: 'user' | 'always' | 'never'
  // merged into new Intl.NumberFormat(...); decimalPlaces overrides its min/max fraction digits
  intlNumberFormatConfig?: Intl.NumberFormatOptions
}

interface CountUpHandle {
  start: () => void
  pause: () => void
  resume: () => void
  toggle: () => void
  reset: () => void
  update: (value: number) => void
}

const CountUp: Component<CountUpProps> = props => {
  const config = useContext(CountUpConfigContext)

  const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max)

  const curve = (progress: number): number => {
    if (progress == 1) return 1

    const logVal = clamp(Math.abs(p.endVal - p.startVal), 1, Infinity)

    return 1 - Math.pow(1 - progress, 4 + Math.log10(logVal) / 1.8)
  }

  const format = (n: number, prefix: string, suffix: string): JSXElement => {
    const r = NumberFormat().formatToParts(n)

    let s = ''

    for (const e of r) {
      if (e.type == 'group' && p.separator) s += p.separator
      else if (e.type == 'decimal' && p.decimal) s += p.decimal
      else s += e.value
    }

    return <>{`${prefix}${s}${suffix}`}</>
  }

  const propsWithDefault = mergeProps(
    {
      // Default values
      startVal: 0,
      duration: 2,
      decimalPlaces: 0,
      useEasing: true,
      easingFn: curve,
      useGrouping: true,
      prefix: '',
      suffix: '',
      formattingFn: format,
      autoAnimate: false,
      autoAnimateThreshold: 0,
      autoAnimateDelay: 200,
      autoAnimateOnce: false,
      reducedMotion: 'user',
      intlNumberFormatConfig: {},
    },
    config,
    props,
  )

  const [p, html] = splitProps(propsWithDefault, [
    'startVal',
    'endVal',
    'duration',
    'decimalPlaces',
    'useEasing',
    'easingFn',
    'useGrouping',
    'locale',
    'prefix',
    'suffix',
    'separator',
    'decimal',
    'formattingFn',
    'ref',
    'onStart',
    'onComplete',
    'onFrame',
    'autoAnimate',
    'autoAnimateThreshold',
    'autoAnimateDelay',
    'autoAnimateOnce',
    'reducedMotion',
    'intlNumberFormatConfig',
  ])

  let startVal = p.startVal
  let endVal = p.endVal

  const mq =
    typeof window === 'undefined'
      ? undefined
      : window.matchMedia('(prefers-reduced-motion: reduce)')
  const skip = p.reducedMotion === 'always' || (p.reducedMotion === 'user' && !!mq?.matches)

  const NumberFormat = createMemo(
    () =>
      new Intl.NumberFormat(p.locale, {
        ...p.intlNumberFormatConfig,
        minimumFractionDigits: clamp(p.decimalPlaces, 0, MAX_FRACTION_DIGITS),
        maximumFractionDigits: clamp(p.decimalPlaces, 0, MAX_FRACTION_DIGITS),
        useGrouping: p.useGrouping,
      }),
  )

  // For SSR purposes
  const [value, setValue] = createSignal(endVal)

  let rAF: number | undefined
  let timeout: ReturnType<typeof setTimeout> | undefined
  let tick_progress = 0
  let element!: HTMLSpanElement
  let hasAnimated = false

  const cancelFrame = () => {
    if (rAF) cancelAnimationFrame(rAF)
    rAF = undefined
  }

  const tick = (initialTimestamp: number, timestamp: number): void => {
    if (p.duration == 0) {
      setValue(endVal)
      if (p.onFrame) p.onFrame(endVal, 1)
      if (p.onComplete) p.onComplete(endVal)

      cancelFrame()
      return
    }

    tick_progress = timestamp - initialTimestamp

    const progress = Math.min(1, (timestamp - initialTimestamp) / (p.duration * 1000))
    const difference = endVal - startVal

    let updatedValue

    if (p.useEasing) {
      const curved_progress = clamp(p.easingFn(progress), 0, 1)

      // No need to account for decimal places since .toFixed() or
      // Intl.NumberFormat().format() is used on value()
      updatedValue = curved_progress * difference + startVal
    } else {
      updatedValue = progress * difference + startVal
    }

    setValue(updatedValue)

    if (p.onFrame) p.onFrame(updatedValue, progress)

    if (progress >= 1) {
      cancelFrame()
      setValue(endVal)
      if (p.onComplete) p.onComplete(endVal)
    } else {
      rAF = requestAnimationFrame((timestamp: number) => {
        tick(initialTimestamp, timestamp)
      })
    }
  }

  createEffect(
    on(
      () => props.endVal,
      (v, prev) => {
        if (prev !== undefined) update(v)
      },
    ),
  )

  onMount(() => {
    if (!skip) reset()

    const callback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !hasAnimated) {
          timeout = setTimeout(start, p.autoAnimateDelay)
          if (p.autoAnimateOnce) hasAnimated = true
        } else if (!hasAnimated) {
          reset()
        }
      })
    }

    const observer = new IntersectionObserver(callback, {
      threshold: p.autoAnimateThreshold,
    })

    if (p.autoAnimate && !skip) observer.observe(element)

    onCleanup(() => {
      observer.disconnect()

      reset()
    })
  })

  const result = createMemo(() => {
    return p.formattingFn(value(), p.prefix, p.suffix)
  })

  const start = () => {
    if (skip) {
      setValue(endVal)

      if (p.onComplete) p.onComplete(endVal)
      return
    }

    reset()

    rAF = requestAnimationFrame(timestamp => {
      tick(timestamp, timestamp)
    })

    if (p.onStart) p.onStart()
  }

  const pause = () => {
    cancelFrame()
  }

  const resume = () => {
    if (skip) {
      setValue(endVal)

      if (p.onComplete) p.onComplete(endVal)
      return
    }

    rAF = requestAnimationFrame(timestamp => {
      tick(timestamp - tick_progress, timestamp)
    })
  }

  const toggle = () => {
    if (rAF === undefined) resume()
    else pause()
  }

  const reset = () => {
    endVal = p.endVal
    startVal = p.startVal
    tick_progress = 0

    if (timeout) clearTimeout(timeout)
    cancelFrame()

    setValue(p.duration != 0 ? startVal : endVal)
  }

  const update = (n: number) => {
    cancelFrame()

    endVal = n
    if (skip) {
      setValue(n)

      if (p.onComplete) p.onComplete(n)
      return
    }

    startVal = value()
    tick_progress = 0

    resume()
  }

  const handle: CountUpHandle = {
    start: start,
    pause: pause,
    resume: resume,
    toggle: toggle,
    reset: reset,
    update: update,
  }

  props.ref?.(handle)

  return (
    <span ref={element} aria-live="off" {...html}>
      {result()}
    </span>
  )
}

export { CountUp, CountUpDefaults }
export type { CountUpProps, CountUpHandle }
export default CountUp
