import * as R from 'ramda'

const _entryToChannel = (channel) => {
  const entryObj = channel.toObject()
  return {
    id: entryObj.id,
    name: entryObj.properties.name,
    private: Boolean(entryObj.properties.private),
    address: entryObj.properties.address,
    unread: parseInt(entryObj.properties.unread),
    description: entryObj.properties.description,
    keys: JSON.parse(entryObj.properties.keys)
  }
}

const processEntries = R.compose(
  R.reverse,
  R.sortBy(R.prop('unread')),
  R.map(_entryToChannel)
)

export default (vault) => {
  const importChannel = async (identityId, channel) => {
    await vault.withWorkspace(workspace => {
      const [channels] = workspace.archive.findGroupsByTitle('Channels')
      let [identityGroup] = channels.getGroups().filter(g => g.getTitle() === identityId)
      if (!identityGroup) {
        identityGroup = channels.createGroup(identityId)
      }
      const isPrivate = channel.private ? 1 : 0
      identityGroup.createEntry(channel.address)
        .setProperty('name', channel.name)
        .setProperty('private', isPrivate.toString())
        .setProperty('address', channel.address)
        .setProperty('unread', `${channel.unread || 0}`)
        .setProperty('description', channel.description)
        .setProperty('keys', JSON.stringify(channel.keys))
      workspace.save()
    })
  }

  const listChannels = async (identityId) => {
    let channelsEntries = []
    await vault.withWorkspace(workspace => {
      const [channels] = workspace.archive.findGroupsByTitle('Channels')
      const [identityChannels] = channels.findGroupsByTitle(identityId)
      channelsEntries = identityChannels ? identityChannels.getEntries() : []
    })
    return processEntries(channelsEntries)
  }

  return {
    listChannels,
    importChannel
  }
}
