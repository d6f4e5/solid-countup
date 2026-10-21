import { createSignal, type Component } from 'solid-js'

import { currentTheme, setTheme, type Theme } from './theme'
import styles from './App.module.css'

const Sun: Component = () => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
)

const Moon: Component = () => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
)

/** Toggles between light and dark. With nothing stored yet it follows the browser. */
const ThemeToggle: Component = () => {
  const [theme, setSignal] = createSignal<Theme>(currentTheme())

  const toggle = () => {
    const next: Theme = theme() === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setSignal(next)
  }

  const label = () => (theme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme')

  return (
    <button class={styles.themeToggle} onClick={toggle} aria-label={label()} title={label()}>
      {theme() === 'dark' ? <Sun /> : <Moon />}
    </button>
  )
}

export default ThemeToggle
