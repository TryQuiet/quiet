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

/**
 * Whether electron-builder will publish this build, decided exactly as its PublishManager does
 * (app-builder-lib/out/publish/PublishManager.js): `--publish`/`-p`, implicit publishing from the
 * `release` npm script, a CI git tag or CI detection, and the pull-request rule, which
 * PUBLISH_FOR_PULL_REQUEST=true overrides. Hooks cannot ask the PublishManager, so before-pack.test.cjs
 * checks this against the real one. Reads process.env and process.argv, like electron-builder.
 */
const willPublish = (argv = process.argv) => {
  const flagged = argv.findIndex(arg => arg === '-p' || arg === '--publish' || /^(?:-p|--publish)=/.test(arg))
  let policy
  if (flagged >= 0) policy = /^(?:-p|--publish)=(.+)$/.exec(argv[flagged])?.[1] ?? argv[flagged + 1]
  const forcePullRequest = process.env.PUBLISH_FOR_PULL_REQUEST === 'true'
  if (require('builder-util').isPullRequest() && !forcePullRequest) return false
  const tag = require('electron-publish').getCiTag()
  if (policy == null) {
    if (process.env.npm_lifecycle_event === 'release') policy = 'always'
    else if (tag != null) policy = 'onTag'
    else {
      // ci-info decides once, when it is first loaded
      delete require.cache[require.resolve('ci-info')]
      if (require('ci-info').isCI) policy = 'onTagOrDraft'
    }
  }
  return policy != null && policy !== 'never' && (policy !== 'onTag' || tag != null)
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

// electron-builder `afterAllArtifactBuild`: signs the build and returns the signature files for
// electron-builder to publish with it. electron-builder writes latest*.yml only after every upload,
// the signatures included, has finished, and not at all if this hook throws, so the feed never
// announces a release whose signature is missing.
//
// A key, when set, must match a public key the app ships, whether or not this build is published,
// and a build that will be published needs one. Every signature is verified against the shipped keys
// here, before anything is uploaded. Builds that are not published (local, PR, e2e, `--publish never`)
// may run without a key.
const signUpdatesWith = async (buildResult, publicKeys) => {
  const files = buildResult.artifactPaths.filter(file => SIGNED_EXTENSIONS.includes(path.extname(file)))
  if (files.length === 0) return []
  if (!process.env[KEY_ENV]) {
    if (!willPublish()) return []
    throw new Error(`Refusing to publish unsigned updates: ${KEY_ENV} is not set`)
  }
  const wrong = signingProblems('linux', process.env, publicKeys)
  if (wrong.length > 0) throw new Error(`Refusing to sign updates: ${wrong.join('; ')}`)
  const privateKey = parsePrivateKey(process.env[KEY_ENV])
  const { version } = require('../package.json')
  // The signature binds the version electron-builder announces in latest.yml (package.json's). An
  // artifact that is not named for it means the two disagree, and no client could verify the update.
  const named = new RegExp(`[ -]${escapeRegExp(version)}\\.(exe|AppImage)$`)
  const mismatched = files.filter(file => !named.test(path.basename(file)))
  if (mismatched.length > 0) {
    throw new Error(
      `Refusing to sign ${mismatched.map(file => path.basename(file)).join(', ')}: not built for version ${version}`
    )
  }
  const signatures = files.map(file => signFile(file, version, privateKey))
  for (const file of files) {
    if (!verifySignatureFile(file, version, publicKeys)) {
      throw new Error(`Signature for ${path.basename(file)} does not verify against the keys the app ships`)
    }
  }
  return signatures
}

exports.default = buildResult => signUpdatesWith(buildResult, loadPublicKeys())

Object.assign(exports, {
  KEY_ENV,
  updateStatement,
  loadPublicKeys,
  publicKeyOf,
  parsePrivateKey,
  signingProblems,
  signFile,
  signUpdatesWith,
  willPublish,
  verifySignatureFile,
})
