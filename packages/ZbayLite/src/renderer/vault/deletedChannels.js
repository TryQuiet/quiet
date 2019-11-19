export default vault => {
  const addToRemoved = async (id, timestamp) => {
    await vault.withWorkspace(workspace => {
      const [removedChannels] = workspace.archive.findGroupsByTitle('RemovedChannels')
      const [channelId] = removedChannels.getEntries().filter(g => g.toObject().properties.title === id)
      if (!channelId) {
        removedChannels
          .createEntry(id)
          .setProperty('timestamp', timestamp.toString())
      } else {
        channelId.setProperty('timestamp', timestamp.toString())
      }
      workspace.save()
    })
  }
  const listRemovedChannels = async () => {
    let removedChannelsEntries = []
    await vault.withWorkspace(workspace => {
      const [removedChannels] = workspace.archive.findGroupsByTitle('RemovedChannels')
      removedChannelsEntries = removedChannels ? removedChannels.getEntries() : []
    })
    const result = removedChannelsEntries.reduce((map, entry) => {
      const entryObj = entry.toObject()
      map[entryObj.properties.title] = entryObj.properties.timestamp
      return map
    }, {})
    return result
  }

  return {
    listRemovedChannels,
    addToRemoved
  }
}
