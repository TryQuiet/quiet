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

// Local and PR builds are never published; every other build must be signed.
const isUnsignedBuild = env =>
  env.GITHUB_EVENT_NAME === 'pull_request' || env.IS_LOCAL === 'true' || env.IS_E2E === 'true'

/** Why a build of `platform` ("win32" | "linux" | ...) cannot be signed with the configured key. */
const signingProblems = (platform, env = process.env, publicKeys = loadPublicKeys()) => {
  if (platform !== 'win32' && platform !== 'linux') return [] // macOS: Squirrel.Mac verifies the bundle
  if (isUnsignedBuild(env)) return []
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

// electron-builder `afterAllArtifactBuild`: signs the build when the release key is configured and
// returns the signature files for electron-builder to publish with it. Whether a build must be
// signed is decided earlier, before anything is packaged or uploaded (beforePack.cjs).
exports.default = async function signUpdates(buildResult) {
  const files = buildResult.artifactPaths.filter(file => SIGNED_EXTENSIONS.includes(path.extname(file)))
  if (files.length === 0 || !process.env[KEY_ENV]) return []
  const privateKey = parsePrivateKey(process.env[KEY_ENV])
  const { version } = require('../package.json')
  // The signature binds the version electron-builder announces in latest.yml (package.json's). An
  // artifact that does not carry it means the two disagree, and no client could verify the update.
  const mismatched = files.filter(file => !path.basename(file).includes(version))
  if (mismatched.length > 0) {
    throw new Error(
      `Refusing to sign ${mismatched.map(file => path.basename(file)).join(', ')}: not built for version ${version}`
    )
  }
  return files.map(file => signFile(file, version, privateKey))
}

Object.assign(exports, {
  KEY_ENV,
  updateStatement,
  loadPublicKeys,
  publicKeyOf,
  parsePrivateKey,
  signingProblems,
  signFile,
})
