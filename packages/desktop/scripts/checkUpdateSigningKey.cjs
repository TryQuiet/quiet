// Proves, without building or publishing anything, that QUIET_UPDATE_SIGNING_KEY holds a usable
// Ed25519 key whose public half is pinned in src/main/update-signing-keys.json. This is the same
// condition scripts/beforePack.cjs enforces before a release is packaged. Prints only the public key.
// Usage: QUIET_UPDATE_SIGNING_KEY=... node checkUpdateSigningKey.cjs
const updateSigning = require('./updateSigning.cjs')

const check = (env = process.env, publicKeys = updateSigning.loadPublicKeys()) => {
  // Not an `isUnsignedBuild` environment: this check always demands the key.
  const { GITHUB_EVENT_NAME, IS_LOCAL, IS_E2E, E2E, ...rest } = env
  const problems = updateSigning.signingProblems('linux', rest, publicKeys)
  const publicKey = problems.length === 0 ? updateSigning.publicKeyOf(updateSigning.parsePrivateKey(rest[updateSigning.KEY_ENV])) : null
  return { problems, publicKey }
}

module.exports = { check }

if (require.main === module) {
  const { problems, publicKey } = check()
  if (problems.length > 0) {
    for (const problem of problems) console.error(`update signing key: ${problem}`)
    process.exit(1)
  }
  console.log(`update signing key OK: matches pinned public key ${publicKey}`)
}
