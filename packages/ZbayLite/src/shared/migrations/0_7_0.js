import { getVault } from '../../renderer/vault'
import channels from '../../renderer/zcash/channels'

const ensureDefaultChannels = async (identity, network) => {
  const generalChannel = channels.general[network]
  const usersChannel = channels.registeredUsers[network]
  const vaultChannels = await getVault().channels.listChannels(identity.id)
  if (!vaultChannels.find(channel => channel.address === generalChannel.address)) {
    await getVault().channels.importChannel(identity.id, generalChannel)
  }
  if (!vaultChannels.find(channel => channel.address === usersChannel.address)) {
    await getVault().channels.importChannel(identity.id, usersChannel)
  }
}
export default {
  ensureDefaultChannels
}
