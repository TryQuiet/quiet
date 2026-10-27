// Release signing for the desktop auto-updater. Each Windows installer and Linux AppImage gets a
// detached Ed25519 signature published next to it as `<file>.sig`; the app ships the matching
// public keys (update-signing-keys.json) and refuses any download that does not verify.
//
// The signed statement binds the app version, the file name and the file's sha512, so a signature
// cannot be replayed for another version or file. It must stay byte-identical to `updateStatement`
// in src/main/updaterSecurity.ts (updater-security.test.cjs and updaterSecurity.test.ts check it).
const crypto = require('crypto')
const fs = require('fs')
const os = require('os')
const path = require('path')

const KEY_ENV = 'QUIET_UPDATE_SIGNING_KEY'
const REQUIRE_ENV = 'QUIET_REQUIRE_UPDATE_SIGNING'
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

// Where electron-builder's S3 publisher (the AWS SDK) can find credentials. A build that has any of them
// could upload, so it must be signed whether or not anyone remembered QUIET_REQUIRE_UPDATE_SIGNING.
const PUBLISH_CREDENTIAL_ENV = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_SESSION_TOKEN',
  'AWS_PROFILE',
  'AWS_WEB_IDENTITY_TOKEN_FILE',
  'AWS_CONTAINER_CREDENTIALS_RELATIVE_URI',
  'AWS_CONTAINER_CREDENTIALS_FULL_URI',
]
const awsFiles = env => [
  env.AWS_SHARED_CREDENTIALS_FILE || path.join(os.homedir(), '.aws', 'credentials'),
  env.AWS_CONFIG_FILE || path.join(os.homedir(), '.aws', 'config'),
]

/**
 * Why this build must carry signatures, or null when it need not: `QUIET_REQUIRE_UPDATE_SIGNING=1`, which
 * the release jobs set, or S3 publishing credentials within reach, so that a publish nobody flagged is
 * still signed. Reads only the environment, never electron-builder's internals. Any other non-empty value
 * of the flag is a mistake and stops the build rather than silently turning the requirement off.
 */
const signingRequirement = (env = process.env) => {
  const value = env[REQUIRE_ENV]
  if (value != null && value !== '' && value !== '1') {
    throw new Error(`${REQUIRE_ENV} must be 1 or unset, not ${JSON.stringify(value)}`)
  }
  if (value === '1') return `${REQUIRE_ENV}=1`
  const credential = PUBLISH_CREDENTIAL_ENV.find(name => env[name])
  if (credential) return `${credential} is set, so this build could publish`
  const file = awsFiles(env).find(candidate => fs.existsSync(candidate))
  if (file) return `${file} exists, so this build could publish`
  return null
}
const signingRequired = (env = process.env) => signingRequirement(env) != null

/**
 * Why a build of `platform` ("win32" | "linux" | ...) cannot be signed with the configured key. Event
 * labels (pull request, local, e2e) never excuse a missing or wrong key: callers ask this for builds
 * that must be signed or that have a key.
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
 * build before any object is written. Returns the `.sig` path, or null when nothing is signed.
 * Whenever a key is set it is used, and it must match a shipped public key, published build or not.
 * Without one the artifact is left unsigned unless the build requires signing (see signingRequirement).
 */
const signArtifactWith = (file, publicKeys, env = process.env) => {
  if (!SIGNED_EXTENSIONS.includes(path.extname(file))) return null
  const required = signingRequirement(env)
  if (!env[KEY_ENV] && required == null) return null
  const wrong = signingProblems('linux', env, publicKeys)
  if (wrong.length > 0) {
    throw new Error(
      `Refusing to sign updates: ${wrong.join('; ')}${required ? ` (signing is required: ${required})` : ''}`
    )
  }
  const version = checkVersionedName(file)
  const signatureFile = signFile(file, version, parsePrivateKey(env[KEY_ENV]))
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
const collectSignaturesWith = (buildResult, publicKeys, env = process.env) => {
  const files = buildResult.artifactPaths.filter(file => SIGNED_EXTENSIONS.includes(path.extname(file)))
  if (files.length === 0) return []
  if (!env[KEY_ENV] && !signingRequired(env)) return []
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
  REQUIRE_ENV,
  signingRequired,
  signingRequirement,
  PUBLISH_CREDENTIAL_ENV,
  updateStatement,
  loadPublicKeys,
  publicKeyOf,
  parsePrivateKey,
  signingProblems,
  signFile,
  signArtifactWith,
  collectSignaturesWith,
  verifySignatureFile,
})
