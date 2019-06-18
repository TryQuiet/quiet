import * as Yup from 'yup'

import { getClient } from '../../renderer/zcash'
import { updateIdentity } from '../../renderer/vault'

const identityKeysSchema = Yup.object().shape({
  sk: Yup.string().required(),
  tpk: Yup.string().required()
})

const _getIdentityKeys = async (identity) => {
  try {
    return await Promise.all([
      await getClient().keys.exportTPK(identity.transparentAddress),
      await getClient().keys.exportSK(identity.address)
    ])
  } catch (err) {
    throw Error('Cannot migrate wallet to version 0.2.x - node doesn\'t contain identity keys.')
  }
}

const ensureIdentityHasKeys = async (identity) => {
  const haveKeys = await identityKeysSchema.isValid(identity.keys)
  if (!haveKeys) {
    const [tpk, sk] = await _getIdentityKeys(identity)
    const identityWithKeys = {
      ...identity,
      keys: {
        tpk,
        sk
      }
    }
    await updateIdentity(identityWithKeys)
    return identityWithKeys
  }
  return identity
}

export default {
  ensureIdentityHasKeys
}
