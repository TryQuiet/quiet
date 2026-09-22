const fs = require('node:fs')
const path = require('node:path')

// Windows dependency caches can contain junctions or materialized copies of local
// dependencies. Discard these before rebuilding submodules so npm cannot reuse
// stale build output, or manipulate a junction into a freshly rebuilt dist tree.
function resetCachedLocalDependencies(root) {
  const packages = path.join(root, 'packages')
  for (const entry of fs.readdirSync(packages, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const directory = path.join(packages, entry.name)
    const manifestPath = path.join(directory, 'package.json')
    if (!fs.existsSync(manifestPath)) continue
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    const dependencies = { ...manifest.dependencies, ...manifest.devDependencies, ...manifest.optionalDependencies }
    for (const [name, spec] of Object.entries(dependencies)) {
      if (!spec.startsWith('file:') || /\.(tgz|tar\.gz)$/.test(spec)) continue
      const installed = path.join(directory, 'node_modules', name)
      let stat
      try {
        stat = fs.lstatSync(installed)
      } catch (error) {
        if (error.code === 'ENOENT') continue
        throw error
      }
      const cachedTarget = stat.isSymbolicLink() ? fs.readlinkSync(installed) : 'materialized directory'
      console.log(`Reset cached local dependency ${path.relative(root, installed)} -> ${cachedTarget}`)
      // Unlink junctions explicitly: never recurse into their source directories.
      if (stat.isSymbolicLink()) fs.unlinkSync(installed)
      else fs.rmSync(installed, { recursive: true, force: true })
    }
  }
}

module.exports = { resetCachedLocalDependencies }
if (require.main === module) resetCachedLocalDependencies(path.resolve(__dirname, '..'))
