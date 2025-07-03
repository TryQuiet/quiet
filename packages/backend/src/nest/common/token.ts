import _sodium from 'libsodium-wrappers-sumo'

export const verifyToken = async (secret: string, token: string): Promise<boolean> => {
  await _sodium.ready
  const sodium = _sodium
  try {
    const secretBytes = sodium.from_base64(secret, sodium.base64_variants.URLSAFE)
    const tokenBytes = sodium.from_base64(token, sodium.base64_variants.URLSAFE)
    const result = sodium.compare(secretBytes, tokenBytes)
    return result === 0
  } catch (e) {
    console.error('Error while comparing tokens', e)
    return false
  }
}
