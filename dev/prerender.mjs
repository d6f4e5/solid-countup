/**
 * Injects the server-rendered markup into the built index.html.
 *
 * The client then hydrates that markup instead of rendering into an empty container, so the
 * page arrives with its content already in the HTML.
 */
import { readFileSync, writeFileSync } from 'node:fs'

const ssr = await import(new URL('./dist-ssr/ssr.js', import.meta.url).href)
const { markup, script } = await ssr.render()

const file = new URL('./dist/index.html', import.meta.url)
const index = readFileSync(file, 'utf8')
const marker = '<div id="root"></div>'

if (!index.includes(marker)) {
  throw new Error(`expected an empty ${marker} in dist/index.html`)
}

// The hydration script goes after the markup, not inside the root element.
writeFileSync(file, index.replace(marker, `<div id="root">${markup}</div>\n${script}`))
console.log(`prerendered ${markup.length} bytes into dist/index.html`)
