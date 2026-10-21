import {
  For,
  Show,
  createSignal,
  onMount,
  type Component,
  type JSX,
  type ParentComponent,
} from 'solid-js'
import CountUp, { CountUpDefaults, type CountUpHandle } from 'src'
import styles from './App.module.css'
import ThemeToggle from './ThemeToggle'

const snippets = {
  install: 'pnpm add solid-countup',
  default: `<CountUp endVal={5234} />`,
  prefix: `<CountUp endVal={5234} prefix="$" suffix=" USD" />`,
  countDown: `<CountUp startVal={5234} endVal={0} />`,
  instant: `<CountUp endVal={5234} duration={0} />`,
  decimals: `<CountUp endVal={1234.567} decimalPlaces={2} />`,
  currency: `<CountUp
  endVal={1234.5}
  decimalPlaces={2}
  locale="en-US"
  intlNumberFormatConfig={{ style: 'currency', currency: 'USD' }}
/>`,
  percent: `<CountUp
  endVal={0.856}
  decimalPlaces={2}
  intlNumberFormatConfig={{ style: 'percent' }}
/>`,
  compact: `<CountUp
  endVal={1_200_000}
  decimalPlaces={1}
  intlNumberFormatConfig={{ notation: 'compact' }}
/>`,
  signed: `<CountUp
  endVal={1234}
  intlNumberFormatConfig={{ signDisplay: 'always' }}
/>`,
  locale: `<CountUp endVal={1234567} locale="hi-IN-u-nu-deva" />`,
  rtl: `<CountUp endVal={1234} locale="ar-EG" />`,
  separators: `<CountUp
  endVal={1234567.89}
  decimalPlaces={2}
  separator=" "
  decimal=","
/>`,
  linear: `<CountUp endVal={5234} useEasing={false} />`,
  custom: `<CountUp
  endVal={5234}
  formattingFn={value => (
    <span class="digits">
      {new Intl.NumberFormat().format(value).split('').map(d => (
        <span>{d}</span>
      ))}
    </span>
  )}
/>`,
  attrs: `<CountUp endVal={5234} class="stat" role="status" aria-live="off" />`,
  defaults: `<CountUpDefaults value={{ duration: 1.2, suffix: '%' }}>
  <CountUp endVal={42} />
  <CountUp endVal={87} />
</CountUpDefaults>`,
  ssr: `import { renderToString } from 'solid-js/web'

renderToString(() => <CountUp endVal={5234} />)
// '<span aria-live="off">5,234</span>'`,
}

const Code: Component<{ code: string }> = props => <pre class={styles.code}>{props.code}</pre>

const Example: ParentComponent<{ title: string; description: string; code: string }> = props => (
  <article class={styles.example}>
    <div class={styles.examplePreview}>{props.children}</div>
    <div class={styles.exampleBody}>
      <h3 class={styles.exampleTitle}>{props.title}</h3>
      <p class={styles.exampleDescription}>{props.description}</p>
    </div>
    <Code code={props.code} />
  </article>
)

const toNumber = (el: HTMLInputElement, fallback = 0) => {
  const value = el.valueAsNumber
  return Number.isFinite(value) ? value : fallback
}

const Playground: Component = () => {
  const [startVal, setStartVal] = createSignal(0)
  const [endVal, setEndVal] = createSignal(1234)
  const [duration, setDuration] = createSignal(2)
  const [decimalPlaces, setDecimalPlaces] = createSignal(2)
  const [useEasing, setUseEasing] = createSignal(true)
  const [useGrouping, setUseGrouping] = createSignal(true)

  let control: CountUpHandle | undefined

  onMount(() => control?.start())

  return (
    <div class={styles.playground}>
      <div class={styles.playgroundStage}>
        <CountUp
          class={styles.playgroundNumber}
          startVal={startVal()}
          endVal={endVal()}
          duration={duration()}
          decimalPlaces={decimalPlaces()}
          useEasing={useEasing()}
          useGrouping={useGrouping()}
          ref={handle => (control = handle)}
        />
      </div>
      <div class={styles.controls}>
        <div class={styles.fields}>
          <label class={styles.field}>
            <span class={styles.fieldLabel}>Start value</span>
            <input
              class={styles.input}
              type="number"
              value={startVal()}
              onInput={event => setStartVal(toNumber(event.currentTarget))}
            />
          </label>
          <label class={styles.field}>
            <span class={styles.fieldLabel}>End value</span>
            <input
              class={styles.input}
              type="number"
              value={endVal()}
              onInput={event => setEndVal(toNumber(event.currentTarget))}
            />
          </label>
          <label class={styles.field}>
            <span class={styles.fieldLabel}>Duration (seconds)</span>
            <input
              class={styles.input}
              type="number"
              min="0"
              step="0.1"
              value={duration()}
              onInput={event => setDuration(Math.max(0, toNumber(event.currentTarget, 2)))}
            />
          </label>
          <label class={styles.field}>
            <span class={styles.fieldLabel}>Decimal places</span>
            <input
              class={styles.input}
              type="number"
              min="0"
              value={decimalPlaces()}
              onInput={event => setDecimalPlaces(Math.max(0, toNumber(event.currentTarget)))}
            />
          </label>
          <div class={styles.toggles}>
            <label class={styles.toggle}>
              <input
                type="checkbox"
                checked={useEasing()}
                onChange={event => setUseEasing(event.currentTarget.checked)}
              />
              <span>Easing</span>
            </label>
            <label class={styles.toggle}>
              <input
                type="checkbox"
                checked={useGrouping()}
                onChange={event => setUseGrouping(event.currentTarget.checked)}
              />
              <span>Grouping</span>
            </label>
          </div>
        </div>
        <div class={styles.buttons}>
          <button class={styles.buttonPrimary} onClick={() => control?.start()}>
            Start
          </button>
          <button class={styles.button} onClick={() => control?.pause()}>
            Pause
          </button>
          <button class={styles.button} onClick={() => control?.resume()}>
            Resume
          </button>
          <button class={styles.button} onClick={() => control?.toggle()}>
            Toggle
          </button>
          <button class={styles.button} onClick={() => control?.reset()}>
            Reset
          </button>
          <button
            class={styles.button}
            onClick={() => setEndVal(Math.round(Math.random() * 100000))}
          >
            Random value
          </button>
        </div>
      </div>
    </div>
  )
}

const Events: Component = () => {
  const [log, setLog] = createSignal<string[]>([])
  const [progress, setProgress] = createSignal(0)

  let control: CountUpHandle | undefined

  onMount(() => control?.start())

  const record = (entry: string) => setLog(previous => [...previous, entry].slice(-5))

  return (
    <div class={styles.events}>
      <div class={styles.eventsStage}>
        <CountUp
          class={styles.eventsNumber}
          endVal={98420}
          duration={2.5}
          onStart={() => {
            setLog([])
            setProgress(0)
            record('onStart()')
          }}
          onFrame={(_value, frameProgress) => setProgress(frameProgress)}
          onComplete={value => record(`onComplete(${value})`)}
          ref={handle => (control = handle)}
        />
        <div class={styles.progress}>
          <div class={styles.progressFill} style={{ width: `${Math.round(progress() * 100)}%` }} />
        </div>
        <div class={styles.eventsActions}>
          <button class={styles.buttonPrimary} onClick={() => control?.start()}>
            Start
          </button>
          <button
            class={styles.button}
            onClick={() => {
              control?.reset()
              setLog([])
              setProgress(0)
            }}
          >
            Reset
          </button>
        </div>
      </div>
      <div class={styles.eventsLog}>
        <h3 class={styles.eventsLogTitle}>Callbacks</h3>
        <Show
          when={log().length}
          fallback={<p class={styles.eventsEmpty}>Press Start to fire the callbacks.</p>}
        >
          <ol class={styles.logList}>
            <For each={log()}>{entry => <li class={styles.logItem}>{entry}</li>}</For>
          </ol>
        </Show>
        <p class={styles.eventsNote}>
          <code>onFrame(value, progress)</code> fires every frame — here it feeds the bar.
        </p>
      </div>
    </div>
  )
}

const Motion: Component = () => {
  const handles: CountUpHandle[] = []
  const [prefersReduced, setPrefersReduced] = createSignal<boolean | undefined>(undefined)

  onMount(() => setPrefersReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches))

  return (
    <>
      <div class={styles.motion}>
        <div class={styles.motionCard}>
          <span class={styles.motionLabel}>reducedMotion="never"</span>
          <CountUp
            class={styles.motionNumber}
            endVal={5234}
            autoAnimate
            reducedMotion="never"
            ref={handle => handles.push(handle)}
          />
        </div>
        <div class={styles.motionCard}>
          <span class={styles.motionLabel}>reducedMotion="always"</span>
          <CountUp
            class={styles.motionNumber}
            endVal={5234}
            autoAnimate
            reducedMotion="always"
            ref={handle => handles.push(handle)}
          />
        </div>
        <div class={styles.motionCard}>
          <span class={styles.motionLabel}>reducedMotion="user"</span>
          <CountUp
            class={styles.motionNumber}
            endVal={5234}
            autoAnimate
            reducedMotion="user"
            ref={handle => handles.push(handle)}
          />
        </div>
      </div>
      <div class={styles.motionFoot}>
        <p class={styles.motionMeta}>
          Your system prefers{' '}
          <strong>
            {prefersReduced() === undefined ? '…' : prefersReduced() ? 'reduced' : 'full'}
          </strong>{' '}
          motion. “always” jumps straight to the target, “never” always animates, and “user” follows
          that setting.
        </p>
        <button class={styles.button} onClick={() => handles.forEach(handle => handle.start())}>
          Replay all
        </button>
      </div>
    </>
  )
}

const App: Component = () => {
  const examples: {
    title: string
    description: string
    code: string
    preview: () => JSX.Element
  }[] = [
    {
      title: 'Default',
      description: 'Counts from 0 to the target over two seconds.',
      code: snippets.default,
      preview: () => <CountUp autoAnimate endVal={5234} />,
    },
    {
      title: 'Prefix and suffix',
      description: 'Wrap the number in literal text.',
      code: snippets.prefix,
      preview: () => <CountUp autoAnimate endVal={5234} prefix="$" suffix=" USD" />,
    },
    {
      title: 'Count down',
      description: 'startVal is where the animation begins.',
      code: snippets.countDown,
      preview: () => <CountUp autoAnimate startVal={5234} endVal={0} />,
    },
    {
      title: 'Instant',
      description: 'duration={0} writes the target with no animation.',
      code: snippets.instant,
      preview: () => <CountUp autoAnimate endVal={5234} duration={0} />,
    },
    {
      title: 'Decimal places',
      description: 'Round to a fixed number of digits.',
      code: snippets.decimals,
      preview: () => <CountUp autoAnimate endVal={1234.567} decimalPlaces={2} />,
    },
    {
      title: 'Currency',
      description: 'Format through Intl with a currency style.',
      code: snippets.currency,
      preview: () => (
        <CountUp
          autoAnimate
          endVal={1234.5}
          decimalPlaces={2}
          locale="en-US"
          intlNumberFormatConfig={{ style: 'currency', currency: 'USD' }}
        />
      ),
    },
    {
      title: 'Percent',
      description: 'Percent formatting multiplies the value by 100.',
      code: snippets.percent,
      preview: () => (
        <CountUp
          autoAnimate
          endVal={0.856}
          decimalPlaces={2}
          intlNumberFormatConfig={{ style: 'percent' }}
        />
      ),
    },
    {
      title: 'Compact notation',
      description: 'Abbreviate large numbers.',
      code: snippets.compact,
      preview: () => (
        <CountUp
          autoAnimate
          endVal={1_200_000}
          decimalPlaces={1}
          intlNumberFormatConfig={{ notation: 'compact' }}
        />
      ),
    },
    {
      title: 'Signed',
      description: 'intlNumberFormatConfig.signDisplay forces the sign.',
      code: snippets.signed,
      preview: () => (
        <CountUp autoAnimate endVal={1234} intlNumberFormatConfig={{ signDisplay: 'always' }} />
      ),
    },
    {
      title: 'Localised digits',
      description: "Use a locale's numbering system.",
      code: snippets.locale,
      preview: () => <CountUp autoAnimate endVal={1234567} locale="hi-IN-u-nu-deva" />,
    },
    {
      title: 'Right-to-left numerals',
      description: 'Arabic-Indic digits and separators, straight from Intl.',
      code: snippets.rtl,
      preview: () => <CountUp autoAnimate endVal={1234} locale="ar-EG" />,
    },
    {
      title: 'Custom separators',
      description: 'Override the grouping and decimal glyphs.',
      code: snippets.separators,
      preview: () => (
        <CountUp autoAnimate endVal={1234567.89} decimalPlaces={2} separator=" " decimal="," />
      ),
    },
    {
      title: 'Linear',
      description: 'Disable easing for a constant rate.',
      code: snippets.linear,
      preview: () => <CountUp autoAnimate endVal={5234} useEasing={false} />,
    },
    {
      title: 'Custom rendering',
      description: 'formattingFn returns your own markup, one node per glyph.',
      code: snippets.custom,
      preview: () => (
        <CountUp
          autoAnimate
          endVal={5234}
          formattingFn={value => (
            <span class={styles.digits}>
              <For each={new Intl.NumberFormat().format(value).split('')}>
                {char => <span class={styles.digit}>{char}</span>}
              </For>
            </span>
          )}
        />
      ),
    },
    {
      title: 'Attribute passthrough',
      description: 'class, id, role and aria-* land on the span.',
      code: snippets.attrs,
      preview: () => (
        <CountUp autoAnimate class={styles.pill} endVal={5234} role="status" aria-live="off" />
      ),
    },
    {
      title: 'App-wide defaults',
      description: 'Share defaults across counters with CountUpDefaults.',
      code: snippets.defaults,
      preview: () => (
        <CountUpDefaults value={{ duration: 1.2, suffix: '%' }}>
          <span class={styles.defaultsRow}>
            <CountUp autoAnimate endVal={42} />
            <CountUp autoAnimate endVal={87} />
          </span>
        </CountUpDefaults>
      ),
    },
  ]

  return (
    <div class={styles.page}>
      <header class={styles.header}>
        <a class={styles.brand} href="#top">
          solid-countup
        </a>
        <div class={styles.headerEnd}>
          <nav class={styles.nav}>
            <a href="/about.html">About</a>
            <a href="https://www.npmjs.com/package/solid-countup">npm</a>
            <a href="https://gitlab.com/d6f4e5/solid-countup">GitLab</a>
            <a href="https://gitlab.com/d6f4e5/solid-countup/-/blob/main/README.md">Docs</a>
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <main class={styles.main} id="top">
        <section class={styles.hero}>
          <p class={styles.eyebrow}>Solid component</p>
          <h1 class={styles.title}>Count up to a number, declaratively.</h1>
          <p class={styles.lede}>
            A Solid component that animates a number from one value to another. It renders a span,
            follows your props reactively, and formats through <code>Intl.NumberFormat</code>.
          </p>
          <div class={styles.heroDemo}>
            <CountUp class={styles.heroNumber} endVal={3847291} duration={2.4} autoAnimate />
          </div>
          <p class={styles.heroNote}>
            Started with <code>autoAnimate</code> — the count begins once it scrolls into view.
          </p>
          <div class={styles.install}>
            <span class={styles.installPrompt}>$</span>
            <code>{snippets.install}</code>
          </div>
        </section>

        <section class={styles.section}>
          <div class={styles.sectionHead}>
            <h2 class={styles.sectionTitle}>Formatting and locales</h2>
            <p class={styles.sectionLede}>
              Each counter animates as it scrolls into view, using <code>autoAnimate</code>.
              Formatting is delegated to <code>Intl.NumberFormat</code>, so currency, percent,
              compact, signing, non-Latin digits and RTL all come for free.
            </p>
          </div>
          <div class={styles.grid}>
            <For each={examples}>
              {example => (
                <Example
                  title={example.title}
                  description={example.description}
                  code={example.code}
                >
                  {example.preview()}
                </Example>
              )}
            </For>
          </div>
        </section>

        <section class={styles.section}>
          <div class={styles.sectionHead}>
            <h2 class={styles.sectionTitle}>Callbacks</h2>
            <p class={styles.sectionLede}>
              <code>onStart</code>, <code>onFrame</code> and <code>onComplete</code> report progress
              as it happens. <code>onFrame</code> is the one CountUp.js has no equivalent for.
            </p>
          </div>
          <Events />
        </section>

        <section class={styles.section}>
          <div class={styles.sectionHead}>
            <h2 class={styles.sectionTitle}>Reduced motion</h2>
            <p class={styles.sectionLede}>
              Respecting <code>prefers-reduced-motion</code> is the default. A skipped animation
              jumps straight to the target and still fires <code>onComplete</code>.
            </p>
          </div>
          <Motion />
        </section>

        <section class={styles.section}>
          <div class={styles.sectionHead}>
            <h2 class={styles.sectionTitle}>Playground</h2>
            <p class={styles.sectionLede}>
              Change the props, then drive the animation with the control handle.
            </p>
          </div>
          <Playground />
        </section>

        <section class={styles.section}>
          <div class={styles.sectionHead}>
            <h2 class={styles.sectionTitle}>Server rendering</h2>
            <p class={styles.sectionLede}>
              On the server the component renders the final value — no flash of <code>0</code>, no
              hydration mismatch, no layout shift. The count-up begins on the client.
            </p>
          </div>
          <div class={styles.codeCard}>
            <Code code={snippets.ssr} />
          </div>
        </section>
      </main>

      <footer class={styles.footer}>
        <p>
          MIT licensed. Inspired by <a href="https://github.com/inorganik/CountUp.js">CountUp.js</a>{' '}
          by Jamie Perkins.
        </p>
      </footer>
    </div>
  )
}

export default App
