import { DateTime } from 'luxon'
import * as R from 'ramda'

const _entryToOffer = offer => {
  const entryObj = offer.toObject()
  return {
    id: entryObj.id,
    name: entryObj.attributes.name,
    offerId: entryObj.attributes.offerId,
    address: entryObj.attributes.address,
    lastSeen: DateTime.fromSeconds(parseInt(entryObj.attributes.lastSeen))
  }
}

const processEntries = R.compose(
  R.reverse,
  R.map(_entryToOffer)
)

export default vault => {
  const importOffer = async (identityId, offer) => {
    await vault.withWorkspace(workspace => {
      const [offers] = workspace.archive.findGroupsByTitle('Offers')
      let [identityGroup] = offers.getGroups().filter(g => g.getTitle() === identityId)
      if (!identityGroup) {
        identityGroup = offers.createGroup(identityId)
      }
      if (identityGroup.getGroups().find(entry => entry.getAttributes().offerId === offer.id)) {
        return
      }
      identityGroup
        .createGroup(offer.id)
        .setAttribute('name', `${offer.tag} @${offer.offerOwner}`)
        .setAttribute('offerId', offer.id)
        .setAttribute('address', offer.address)
        .setAttribute('lastSeen', `0`)
      workspace.save()
    })
  }
  const saveMessage = async ({ identityAddress, identityName, message, status, txId }) => {
    await vault.withWorkspace(workspace => {
      const [offers] = workspace.archive.findGroupsByTitle('Offers')
      let [identityGroup] = offers
        .getGroups()[0]
        .getGroups()
        .filter(g => g.getTitle() === message.message.itemId)
      identityGroup
        .createEntry(txId)
        .setProperty('id', txId)
        .setProperty('type', message.type.toString())
        .setProperty('sender', identityAddress)
        .setProperty('senderUsername', identityName)
        .setProperty('message', JSON.stringify(message.message))
        .setProperty('spent', message.spent ? message.spent.toString() : null)
        .setProperty('createdAt', message.createdAt.toString())
        .setProperty('status', status)
      workspace.save()
    })
  }
  const removeOffer = async ({ identityId, offerId }) => {
    // TODO removeOffer
  }

  const listOffers = async identityId => {
    let OffersEntries = []
    await vault.withWorkspace(workspace => {
      const [offers] = workspace.archive.findGroupsByTitle('Offers')
      const [identityOffers] = offers.findGroupsByTitle(identityId)
      OffersEntries = identityOffers ? identityOffers.getGroups() : []
    })
    return processEntries(OffersEntries)
  }

  const listMessages = async ({ identityId, offerId }) => {
    let messagesEntries = []
    await vault.withWorkspace(workspace => {
      const [offers] = workspace.archive.findGroupsByTitle('Offers')
      let [identityGroup] = offers
        .getGroups()[0]
        .getGroups()
        .filter(g => g.getTitle() === offerId)
      messagesEntries = identityGroup.getEntries()
    })
    return messagesEntries.map(entry => entry.toObject())
  }

  const updateLastSeen = async ({ identityId, offerId, lastSeen }) => {
    await vault.withWorkspace(workspace => {
      const [offers] = workspace.archive.findGroupsByTitle('Offers')
      let [offer] = offers
        .getGroups()[0]
        .getGroups()
        .filter(g => g.getTitle() === offerId)
      if (offer !== null) {
        offer.setAttribute('lastSeen', `${lastSeen.toSeconds()}`)
      }
      workspace.save()
    })
  }

  return {
    listOffers,
    updateLastSeen,
    importOffer,
    removeOffer,
    saveMessage,
    listMessages
  }
}
