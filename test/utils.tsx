import { vi } from 'vitest'
import { render } from 'solid-js/web'
import type { JSXElement } from 'solid-js'

/**
 * Shared harness for the client (jsdom) tests.
 *
 * The component reads three browser globals that jsdom doesn't implement —
 * `window.matchMedia`, `IntersectionObserver` and the frame loop — so tests
 * install controlled stand-ins rather than depend on real timing.
 */

/** Mutable state the stubbed `matchMedia` reads from. */
export const media = { reduce: false }

export function installMatchMedia(): void {
  const impl = (query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? media.reduce : false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
  window.matchMedia = impl as unknown as typeof window.matchMedia
}

export interface FrameLoop {
  /** Callbacks currently waiting for a frame. */
  readonly pending: number
  /** The synthetic timestamp the loop has advanced to. */
  readonly now: number
  /** Fire every queued callback once, advancing the clock. */
  step(ms?: number): void
  /** Fire `frames` frames. */
  run(frames: number, ms?: number): void
  reset(): void
}

/**
 * Replace `requestAnimationFrame` / `cancelAnimationFrame` with a queue that
 * only advances when the test says so. `cancelAnimationFrame` really removes
 * the callback, so `pause()` and `reset()` are observable.
 */
export function installFrames(): FrameLoop {
  let id = 0
  let clock = 0
  const queue = new Map<number, FrameRequestCallback>()

  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    const next = ++id
    queue.set(next, cb)
    return next
  })
  vi.stubGlobal('cancelAnimationFrame', (handle: number) => {
    queue.delete(handle)
  })

  const loop: FrameLoop = {
    get pending() {
      return queue.size
    },
    get now() {
      return clock
    },
    step(ms = 1000 / 60) {
      const due = [...queue.values()]
      queue.clear()
      clock += ms
      for (const cb of due) cb(clock)
    },
    run(frames, ms = 1000 / 60) {
      for (let i = 0; i < frames; i++) loop.step(ms)
    },
    reset() {
      queue.clear()
      clock = 0
      id = 0
    },
  }

  return loop
}

type IOCallback = IntersectionObserverCallback

/** Records the instances the component creates so a test can drive them. */
export class MockIO {
  static instances: MockIO[] = []

  static reset(): void {
    MockIO.instances = []
  }

  observed: Element[] = []
  disconnected = false
  callback: IOCallback
  options?: IntersectionObserverInit

  constructor(callback: IOCallback, options?: IntersectionObserverInit) {
    this.callback = callback
    this.options = options
    MockIO.instances.push(this)
  }

  observe(el: Element): void {
    this.observed.push(el)
  }

  unobserve(el: Element): void {
    this.observed = this.observed.filter(e => e !== el)
  }

  disconnect(): void {
    this.disconnected = true
    this.observed = []
  }

  takeRecords(): IntersectionObserverEntry[] {
    return []
  }

  /** Deliver a single intersection change. */
  trigger(isIntersecting: boolean): void {
    this.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    )
  }
}

export function installIO(): void {
  MockIO.reset()
  vi.stubGlobal('IntersectionObserver', MockIO)
}

export interface Mounted {
  container: HTMLDivElement
  /** Rendered text of the first child (the component's span). */
  readonly text: string
  /** `innerHTML` of the container. */
  readonly html: string
  /** The component's span. */
  readonly el: HTMLElement
  dispose(): void
}

const liveDisposers: Array<() => void> = []

export function mount(view: () => JSXElement): Mounted {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const dispose = render(view, container)

  let done = false
  const teardown = () => {
    if (done) return
    done = true
    dispose()
    container.remove()
  }
  liveDisposers.push(teardown)

  return {
    container,
    get text() {
      return container.textContent ?? ''
    },
    get html() {
      return container.innerHTML
    },
    get el() {
      return container.firstElementChild as HTMLElement
    },
    dispose: teardown,
  }
}

/** Tear down anything mounted, reset stubs and the reduced-motion state. */
export function cleanupDom(): void {
  for (const dispose of liveDisposers.splice(0)) dispose()
  document.body.innerHTML = ''
  media.reduce = false
  vi.useRealTimers()
  vi.unstubAllGlobals()
}

/** Frame count that comfortably covers a `duration` in seconds. */
export function framesFor(duration: number, stepMs = 50): number {
  return Math.ceil((duration * 1000) / stepMs) + 2
}
