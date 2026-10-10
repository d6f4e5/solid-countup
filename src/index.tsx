import {
  Component,
  createSignal,
  mergeProps,
  splitProps,
  onMount,
  JSX,
  createMemo,
  onCleanup
} from 'solid-js'

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
  formattingFn?: (value: number, prefix: string, suffix: string) => string
  ref?: (handle: CountUpHandle) => void
  onStart?: () => void
  onComplete?: (endVal: number) => void
  onFrame?: (value: number, progress: number) => void
  autoAnimate?: boolean
  autoAnimateThreshold?: number
  autoAnimateDelay?: number
  autoAnimateOnce?: boolean
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
  const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max)

  const curve = (progress: number): number => {
    if (progress == 1) return 1

    const logVal = clamp(Math.abs(p.endVal - p.startVal), 1, Infinity)

    return 1 - Math.pow(1 - progress, 4 + Math.log10(logVal) / 1.8)
  }

  const format = (n: number, prefix: string, suffix: string): string => {
    const r = new Intl.NumberFormat(p.locale, {
      minimumFractionDigits: p.decimalPlaces,
      maximumFractionDigits: p.decimalPlaces,
      useGrouping: p.useGrouping,
    }).formatToParts(n)

    let s = ''

    for (const e of r) {
      if (e.type == 'group' && p.separator) s += p.separator
      else if (e.type == 'decimal' && p.decimal) s += p.decimal
      else s += e.value
    }

    return `${prefix}${s}${suffix}`
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
    },
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
  ])

  let startVal = p.startVal
  let endVal = p.endVal

  const [value, setValue] = createSignal(p.duration != 0 ? startVal : endVal)

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

  onMount(() => {
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

    if (p.autoAnimate) observer.observe(element)

    onCleanup(() => {
      observer.disconnect()

      reset()
    })
  })

  const result = createMemo(() => {
    return p.formattingFn(value(), p.prefix, p.suffix)
  })

  const start = () => {
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
    <span ref={element} {...html}>
      {result()}
    </span>
  )
}

export default CountUp
