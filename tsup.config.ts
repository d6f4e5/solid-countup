import { readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'tsup'
import * as preset from 'tsup-preset-solid'

const preset_options: preset.PresetOptions = {
  // array or single object
  entries: [
    // default entry (index)
    {
      // entries with '.tsx' extension will have `solid` export condition generated
      entry: 'src/index.tsx',
      // will generate a separate development entry
      dev_entry: true,
      // will generate a separate server entry. Without this the `import`/`require`
      // conditions point at a DOM-compiled build, and `template()` at module scope
      // throws "Client-only API called on the server side" the moment an SSR
      // consumer resolves it. This compiles the same source with `generate: 'ssr'`
      // and exposes it under the `node`/`worker`/`deno` conditions.
      server_entry: true,
    },
  ],
  // Set to `true` to remove all `console.*` calls and `debugger` statements in prod builds
  drop_console: true,
  // Set to `true` to generate a CommonJS build alongside ESM
  cjs: true,
}

const CI =
  process.env['CI'] === 'true' ||
  process.env['GITHUB_ACTIONS'] === 'true' ||
  process.env['CI'] === '"1"' ||
  process.env['GITHUB_ACTIONS'] === '"1"'

/**
 * Update ./package.json with the fields tsup-preset-solid derives from the entries.
 *
 * tsup evaluates this config once per output variant (main, dev, jsx), so the
 * preset's own `writePackageJson` runs several times, concurrently. It is a
 * read-modify-write, and tsup itself reads ./package.json (for `type` and
 * `peerDependencies`) while those writes are in flight — so a half-written file
 * makes tsup silently fall back to defaults, emitting `.mjs`/`.js` instead of
 * `.js`/`.cjs` and bundling `solid-js` instead of externalising it. Writing to a
 * temp file and renaming keeps every concurrent read complete.
 */
/**
 * Drop the `solid` condition from the generated server branches.
 *
 * tsup-preset-solid nests `solid: ./dist/server.jsx` inside `node`/`worker`/`deno`. That raw JSX
 * only helps a bundler that will compile it, and Vite does not run the Solid transform over
 * `node_modules` in SSR — it resolves the file, compiles it in DOM mode, and the render dies with
 * "Client-only API called on the server side". Letting those branches fall through to
 * `import`/`require` hands SSR consumers the pre-compiled `dist/server.js` instead. The client
 * build is unaffected: it resolves the `browser` branch, which keeps its `solid` entry.
 */
function dropSolidFromServerConditions(fields: Record<string, unknown>): void {
  const conditions = fields['exports']
  if (typeof conditions !== 'object' || conditions === null) return

  for (const condition of ['worker', 'deno', 'node']) {
    const branch = (conditions as Record<string, unknown>)[condition]
    if (typeof branch !== 'object' || branch === null) continue
    delete (branch as Record<string, unknown>)['solid']
  }
}

function writePackageJson(fields: object): void {
  const file = path.join(process.cwd(), 'package.json')
  try {
    dropSolidFromServerConditions(fields as Record<string, unknown>)
    const pkg = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>
    const next = { ...pkg, ...fields, type: 'module' }
    const tmp = `${file}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`
    writeFileSync(tmp, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
    renameSync(tmp, file)
  } catch (error) {
    console.warn('tsup: could not update package.json exports', error)
  }
}

export default defineConfig(config => {
  const watching = !!config.watch

  const parsed_options = preset.parsePresetOptions(preset_options, watching)

  if (!watching && !CI) {
    const package_fields = preset.generatePackageExports(parsed_options)

    console.log(`package.json: \n\n${JSON.stringify(package_fields, null, 2)}\n\n`)

    writePackageJson(package_fields)
  }

  return preset.generateTsupOptions(parsed_options)
})
