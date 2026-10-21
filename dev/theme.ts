export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'solid-countup-theme'

/**
 * The theme currently on screen: an explicit choice if one was made, otherwise whatever the
 * browser prefers. The inline script in index.html applies the stored choice before first
 * paint, so this reads the same value the user already sees.
 */
export const currentTheme = (): Theme => {
  const explicit = document.documentElement.dataset.theme
  if (explicit === 'light' || explicit === 'dark') return explicit
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const setTheme = (theme: Theme): void => {
  document.documentElement.dataset.theme = theme

  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Storage can be unavailable (private mode, blocked cookies). The theme still applies to
    // this page, it just will not be remembered on the next visit.
  }
}
