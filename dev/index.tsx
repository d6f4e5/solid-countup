import { hydrate, render } from 'solid-js/web'
import './styles.css'

import App from './App'

const root = document.getElementById('root')!

// The markup in index.html is rendered at build time (see prerender.mjs), so hydrate it rather
// than throwing it away and rendering again. The dev server has no prerendered markup, hence
// the fallback.
if (root.childElementCount > 0) {
  hydrate(() => <App />, root)
} else {
  render(() => <App />, root)
}
