import BigNumber from 'bignumber.js'

import { DisplayableMessage, messageType } from '../zbay/messages'

const _entryToMessage = advert => {
  const entryObj = advert.toObject()
  return DisplayableMessage({
    id: entryObj.properties.id,
    type: messageType.AD,
    sender: { replyTo: entryObj.properties.address, username: entryObj.properties.offerOwner },
    createdAt: parseInt(entryObj.properties.createdAt),
    message: {
      tag: entryObj.properties.tag,
      background: entryObj.properties.background,
      description: entryObj.properties.description,
      provideShipping: entryObj.properties.provideShipping,
      title: entryObj.properties.title,
      amount: entryObj.properties.amount
    },
    spent: new BigNumber(entryObj.properties.spent)
  })
}

export default vault => {
  const addAdvert = async message => {
    await vault.withWorkspace(workspace => {
      const [txns] = workspace.archive.findGroupsByTitle('Adverts')
      const [advert] = txns.getEntries().filter(g => g.toObject().properties.id === message.id)
      if (!advert) {
        txns
          .createEntry(message.id)
          .setProperty('tag', message.message.tag)
          .setProperty('id', message.id)
          .setProperty('createdAt', message.createdAt.toString())
          .setProperty('description', message.message.description)
          .setProperty('background', message.message.background)
          .setProperty('title', message.message.title)
          .setProperty('amount', message.message.amount)
          .setProperty('provideShipping', message.message.provideShipping)
          .setProperty('offerOwner', message.sender.username)
          .setProperty('address', message.sender.replyTo)
          .setProperty('spent', message.spent.toString())
      }
      workspace.save()
    })
  }
  const getAdvert = async id => {
    let advert
    await vault.withWorkspace(workspace => {
      const [adverts] = workspace.archive.findGroupsByTitle('Adverts')
      advert = adverts.getEntries().filter(g => g.toObject().properties.id === id)
    })
    return _entryToMessage(advert[0])
  }

  return {
    getAdvert,
    addAdvert
  }
}
