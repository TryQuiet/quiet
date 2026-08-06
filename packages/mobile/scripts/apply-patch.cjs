const { readFileSync } = require('node:fs')
const { resolve } = require('node:path')
const { spawnSync } = require('node:child_process')

const args = process.argv.slice(2)
const patchPath = args[0]

if (!patchPath) {
  throw new Error('Usage: apply-patch.cjs <patch-file> [--binary] [--production-only] [--directory <path>]')
}

if (args.includes('--production-only') && process.env.NODE_ENV !== 'production') {
  process.exit(0)
}

const directoryIndex = args.indexOf('--directory')
const cwd = directoryIndex === -1 ? process.cwd() : resolve(process.cwd(), args[directoryIndex + 1])
const patchArgs = ['-f', '-p0', '--forward']

if (args.includes('--binary')) patchArgs.push('--binary')

const result = spawnSync('patch', patchArgs, {
  cwd,
  input: readFileSync(resolve(process.cwd(), patchPath)),
  encoding: 'utf8',
  shell: process.platform === 'win32',
})

if (result.stdout) process.stdout.write(result.stdout)
if (result.stderr) process.stderr.write(result.stderr)

// These patches may already be present after a previous install. Preserve the
// original prepare behavior by treating rejected/already-applied patches as OK.
if (result.error && result.error.code === 'ENOENT') {
  throw new Error(`The 'patch' executable is required: ${result.error.message}`)
}
