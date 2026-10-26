// Release signing for the desktop auto-updater. Each Windows installer and Linux AppImage gets a
// detached Ed25519 signature published next to it as `<file>.sig`; the app ships the matching
// public keys (update-signing-keys.json) and refuses any download that does not verify.
//
// The signed statement binds the app version, the file name and the file's sha512, so a signature
// cannot be replayed for another version or file. It must stay byte-identical to `updateStatement`
// in src/main/updaterSecurity.ts (updater-security.test.cjs and updaterSecurity.test.ts check it).
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const KEY_ENV = 'QUIET_UPDATE_SIGNING_KEY'
const SIGNED_EXTENSIONS = ['.exe', '.AppImage']

const updateStatement = (version, fileName, sha512Base64) =>
  `quiet-update-signature-v1\nversion:${version}\nfile:${fileName}\nsha512:${sha512Base64}\n`

const publicKeysFile = path.join(__dirname, '..', 'src', 'main', 'update-signing-keys.json')
const loadPublicKeys = () => JSON.parse(fs.readFileSync(publicKeysFile, 'utf8')).publicKeys

const publicKeyOf = privateKey =>
  crypto.createPublicKey(privateKey).export({ type: 'spki', format: 'der' }).toString('base64')

// PEM (PKCS#8), either as is or base64-encoded, which survives being stored as a CI secret.
const parsePrivateKey = value => {
  const pem = value.includes('-----BEGIN') ? value : Buffer.from(value, 'base64').toString('utf8')
  const key = crypto.createPrivateKey(pem)
  if (key.asymmetricKeyType !== 'ed25519') throw new Error(`${KEY_ENV} is not an Ed25519 key`)
  return key
}

const BUILDER_CLI =
  /(?:^|[\\/])electron-builder(?:\.cmd|\.js|\.exe)?$|[\\/]electron-builder[\\/]out[\\/]cli[\\/]cli\.js$/

/**
 * Whether this build is EXPLICITLY not published: it was started by the electron-builder command
 * line with exactly one `--publish never` (`-p never`), as electron-builder's own yargs parser reads
 * it. Nothing else counts. electron-builder decides publishing from more than the command line
 * (implicit CI, tag, `release`-script and pull-request rules, repeated flags that reach it as an
 * array, the JS API's `publish` option) and hooks cannot ask its PublishManager, so everything not
 * provably "never" is treated as a publish and needs the signing key. The JS API therefore never
 * qualifies; callers disable these hooks in their config when they build without publishing.
 */
const explicitlyUnpublished = (argv = process.argv) => {
  if (!BUILDER_CLI.test(argv[1] ?? '')) return false
  try {
    const builderDir = path.dirname(require.resolve('electron-builder/package.json'))
    const yargs = require(require.resolve('yargs/yargs', { paths: [builderDir] }))
    const { configureBuildCommand } = require('electron-builder/out/builder')
    const parsed = configureBuildCommand(yargs(argv.slice(2)))
      .exitProcess(false)
      .fail((message, error) => {
        throw error ?? new Error(message)
      })
      .parse()
    return parsed.publish === 'never'
  } catch {
    return false
  }
}

/**
 * Why a build of `platform` ("win32" | "linux" | ...) cannot be signed with the configured key. Event
 * labels (pull request, local, e2e) never excuse a missing or wrong key: callers ask this only for
 * builds that are to be published.
 */
const signingProblems = (platform, env = process.env, publicKeys = loadPublicKeys()) => {
  if (platform !== 'win32' && platform !== 'linux') return [] // macOS: Squirrel.Mac verifies the bundle
  if (!env[KEY_ENV]) return [`${KEY_ENV} is not set, so the update would not carry a signature the app accepts`]
  try {
    const publicKey = publicKeyOf(parsePrivateKey(env[KEY_ENV]))
    if (!publicKeys.includes(publicKey)) {
      return [`${KEY_ENV} does not match any key in update-signing-keys.json, so the app would reject the update`]
    }
  } catch (error) {
    return [`${KEY_ENV} is unusable: ${error.message}`]
  }
  return []
}

const signFile = (filePath, version, privateKey) => {
  const sha512 = crypto.createHash('sha512').update(fs.readFileSync(filePath)).digest('base64')
  const statement = updateStatement(version, path.basename(filePath), sha512)
  const signature = crypto.sign(null, Buffer.from(statement), privateKey).toString('base64')
  const signatureFile = `${filePath}.sig`
  fs.writeFileSync(signatureFile, `${signature}\n`)
  return signatureFile
}

const escapeRegExp = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Checks `<file>.sig` the way the app does, against the public keys compiled into it. */
const verifySignatureFile = (file, version, publicKeys) => {
  const statement = Buffer.from(
    updateStatement(
      version,
      path.basename(file),
      crypto.createHash('sha512').update(fs.readFileSync(file)).digest('base64')
    )
  )
  const signature = Buffer.from(fs.readFileSync(`${file}.sig`, 'utf8').trim(), 'base64')
  return publicKeys.some(key =>
    crypto.verify(
      null,
      statement,
      crypto.createPublicKey({ key: Buffer.from(key, 'base64'), format: 'der', type: 'spki' }),
      signature
    )
  )
}

// The version electron-builder announces in latest.yml (package.json's) is what a signature binds. An
// artifact that is not named for it means the two disagree, and no client could verify the update.
const checkVersionedName = file => {
  const { version } = require('../package.json')
  const named = new RegExp(`[ -]${escapeRegExp(version)}\\.(exe|AppImage)$`)
  if (!named.test(path.basename(file))) {
    throw new Error(`Refusing to sign ${path.basename(file)}: not built for version ${version}`)
  }
  return version
}

/**
 * Signs one primary artifact (`.exe`, `.AppImage`) and verifies the signature against the keys the app
 * ships. Run from electron-builder's `artifactBuildCompleted` hook (scripts/signArtifact.cjs), which
 * fires before electron-builder starts uploading that artifact, so a bad key or signature stops the
 * build before any object is written. Returns the `.sig` path, or null when nothing needs signing.
 * A key, when set, must match a shipped public key even for unpublished builds; without one only an
 * explicitly unpublished build (`--publish never`) may continue.
 */
const signArtifactWith = (file, publicKeys, argv = process.argv) => {
  if (!SIGNED_EXTENSIONS.includes(path.extname(file))) return null
  if (!process.env[KEY_ENV]) {
    if (explicitlyUnpublished(argv)) return null
    throw new Error(
      `Refusing to build a publishable update without a signing key: ${KEY_ENV} is not set (use --publish never for a build that is not released)`
    )
  }
  const wrong = signingProblems('linux', process.env, publicKeys)
  if (wrong.length > 0) throw new Error(`Refusing to sign updates: ${wrong.join('; ')}`)
  const version = checkVersionedName(file)
  const signatureFile = signFile(file, version, parsePrivateKey(process.env[KEY_ENV]))
  if (!verifySignatureFile(file, version, publicKeys)) {
    throw new Error(`Signature for ${path.basename(file)} does not verify against the keys the app ships`)
  }
  return signatureFile
}

// electron-builder `afterAllArtifactBuild`: hands the signature files to electron-builder to publish with the
// release. They were made and verified per artifact by signArtifactWith before upload; this only
// returns them and fails if one is missing or no longer verifies. electron-builder writes latest*.yml
// only after every upload, the signatures included, has finished, and not at all if this hook throws,
// so the feed never announces a release whose signature is missing.
const collectSignaturesWith = (buildResult, publicKeys, argv = process.argv) => {
  const files = buildResult.artifactPaths.filter(file => SIGNED_EXTENSIONS.includes(path.extname(file)))
  if (files.length === 0) return []
  if (!process.env[KEY_ENV] && explicitlyUnpublished(argv)) return []
  return files.map(file => {
    const version = checkVersionedName(file)
    if (!fs.existsSync(`${file}.sig`) || !verifySignatureFile(file, version, publicKeys)) {
      throw new Error(
        `${path.basename(
          file
        )} has no valid release-key signature (it is made before upload by scripts/signArtifact.cjs)`
      )
    }
    return `${file}.sig`
  })
}

exports.default = async buildResult => collectSignaturesWith(buildResult, loadPublicKeys())

Object.assign(exports, {
  KEY_ENV,
  updateStatement,
  loadPublicKeys,
  publicKeyOf,
  parsePrivateKey,
  signingProblems,
  signFile,
  signArtifactWith,
  collectSignaturesWith,
  explicitlyUnpublished,
  verifySignatureFile,
})
