const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const { execFileSync } = require('node:child_process')

const manifest = require('../patch/libp2p/gossipsub-14.1.0.json')
const patch = path.join(__dirname, '../patch/libp2p/gossipsub-14.1.0.patch')
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')

try {
  const requested = path.resolve(process.argv[2] ?? path.join(__dirname, '../node_modules/@chainsafe/libp2p-gossipsub'))
  // macOS commonly aliases /var and /tmp to /private. Canonicalize the
  // legitimate installation root, while retaining dependency-path checks.
  const packageDirectory = process.argv[2]
    ? path.join(fs.realpathSync(path.dirname(requested)), path.basename(requested))
    : path.join(fs.realpathSync(path.join(__dirname, '..')), 'node_modules/@chainsafe/libp2p-gossipsub')
  // Worktree overlays can point into another checkout's dependencies. Require
  // a private copy before applying this mandatory runtime correction.
  if (fs.realpathSync(packageDirectory) !== packageDirectory) {
    throw new Error('The package path traverses a symlink; copy the package into this installation before patching')
  }
  const installed = JSON.parse(fs.readFileSync(path.join(packageDirectory, 'package.json'), 'utf8'))
  if (installed.name !== manifest.name || installed.version !== manifest.version) {
    throw new Error(`Expected ${manifest.name}@${manifest.version}, found ${installed.name}@${installed.version}`)
  }
  const files = Object.entries(manifest.files)
  const hashes = new Map(files.map(([file]) => [file, hash(path.join(packageDirectory, file))]))
  if (files.every(([file, expected]) => hashes.get(file) === expected.after)) {
    console.log('Gossipsub transport lifecycle patch is already applied')
    process.exit(0)
  }
  if (!files.every(([file, expected]) => hashes.get(file) === expected.before)) {
    throw new Error('Unexpected or partially patched gossipsub files; refusing to modify this installation')
  }
  // Check every hunk before changing any file. Hash validation prevents fuzzy
  // application to a different package release or a locally modified copy.
  const args = ['--batch', '--forward', '--fuzz=0', '-p1', '--directory', packageDirectory, '--input', patch]
  execFileSync('patch', ['--dry-run', ...args], { stdio: 'pipe' })
  execFileSync('patch', args, { stdio: 'pipe' })
  if (!files.every(([file, expected]) => hash(path.join(packageDirectory, file)) === expected.after)) {
    throw new Error('Gossipsub patch output does not match the verified runtime')
  }
  console.log('Applied gossipsub transport lifecycle patch')
} catch (error) {
  console.error(`Cannot apply required gossipsub patch: ${error.message}`)
  process.exit(1)
}
