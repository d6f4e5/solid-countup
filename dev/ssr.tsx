import { generateHydrationScript, renderToString } from 'solid-js/web'

import App from './App'

/**
 * The published types resolve to solid-js/web's client build, where this takes no options. The
 * server build, which this file runs under, accepts the event names to replay.
 */
const hydrationScript = generateHydrationScript as (options?: { eventNames?: string[] }) => string

/**
 * Rendered at build time and injected into the built index.html, so crawlers and clients
 * without JavaScript get the page content instead of an empty <div id="root">.
 *
 * The hydration script emits the `window._$HY` context the client needs to hydrate the markup,
 * plus the event delegation that replays clicks made before hydration.
 */
export const render = (): { markup: string; script: string } => ({
  markup: renderToString(() => <App />),
  script: hydrationScript({ eventNames: ['click', 'input', 'change'] }),
})
