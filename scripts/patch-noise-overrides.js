#!/usr/bin/env node
/**
 * Inject npm `overrides` into the js-libp2p-noise submodule before it is installed/built.
 *
 * The submodule has no committed lockfile and installs with `npm i`, so its transitive dependency
 * tree drifts. A newer `@libp2p/crypto` now pulls `@libp2p/interface@3` + `uint8arraylist@3`
 * alongside the v2 versions the submodule is written against, leaving two incompatible copies whose
 * `Uint8ArrayList` generics differ. That makes the submodule's own `tsc` build fail with
 * "No overload matches this call" on `PublicKey`/`PrivateKey`.
 *
 * Forcing every nested copy to the version the submodule's *direct* (v2) dependency resolves to
 * dedupes them and fixes the build. We keep this fix in the quiet repo (not the noise fork) by
 * patching the submodule's package.json at build time; `build:noise` runs this first.
 */
const fs = require('fs')
const path = require('path')

const pkgPath = path.resolve(__dirname, '..', '3rd-party', 'js-libp2p-noise', 'package.json')
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))

pkg.overrides = {
  ...pkg.overrides,
  // `$name` pins every nested copy to the version the matching direct dependency resolves to (v2).
  '@libp2p/interface': '$@libp2p/interface',
  uint8arraylist: '$uint8arraylist',
}

fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
console.log('[patch-noise-overrides] pinned @libp2p/interface + uint8arraylist to dedupe js-libp2p-noise deps')
