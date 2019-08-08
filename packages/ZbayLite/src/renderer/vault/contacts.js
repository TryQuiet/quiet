import { DateTime } from 'luxon'
import * as R from 'ramda'
import BigNumber from 'bignumber.js'

const _entryToMessage = (message) => {
  const entryObj = message.toObject()
  return {
    id: entryObj.properties.title,
    sender: entryObj.properties.sender,
    type: parseInt(entryObj.properties.type),
    message: JSON.parse(entryObj.properties.message),
    spent: new BigNumber(entryObj.properties.spent),
    createdAt: DateTime.fromSeconds(parseInt(entryObj.properties.createdAt)),
    status: entryObj.properties.status
  }
}

const processEntries = R.compose(
  R.reverse,
  R.map(_entryToMessage)
)

export default (vault) => {
  const _getIdentityMessages = ({ identityId, workspace }) => {
    const [contacts] = workspace.archive.findGroupsByTitle('Contacts')
    const [identityGroup] = contacts.findGroupsByTitle(identityId)
    if (!identityGroup) {
      const createdIdentityGroup = contacts.createGroup(identityId)
      return createdIdentityGroup
    }
    return identityGroup
  }

  const _getRecipientMessages = ({ identityGroup, recipientAddress, recipientUsername, workspace }) => {
    const [recipientGroup] = identityGroup.findGroupsByTitle(recipientAddress)
    if (!recipientGroup) {
      const createdRecipientGroup = identityGroup.createGroup(recipientAddress)
      createdRecipientGroup.setAttribute('username', recipientUsername)
      createdRecipientGroup.setAttribute('address', recipientAddress)
      createdRecipientGroup.setAttribute('lastSeen', '')
      return createdRecipientGroup
    }
    return recipientGroup
  }

  const saveMessage = async ({ identityId, message, recipientAddress, recipientUsername }) => {
    await vault.withWorkspace(workspace => {
      const identityGroup = _getIdentityMessages({ identityId, workspace })
      const recipientGroup = _getRecipientMessages({ identityGroup, recipientAddress, recipientUsername, workspace })
      recipientGroup.createEntry(message.id.toString())
        .setProperty('id', message.id.toString())
        .setProperty('type', message.type.toString())
        .setProperty('sender', message.sender.replyTo)
        .setProperty('message', JSON.stringify(message.message))
        .setProperty('spent', message.spent.toString())
        .setProperty('createdAt', message.createdAt.toString())
        .setProperty('status', message.status)
      workspace.save()
    })
  }

  const deleteMessage = async ({ messageId, identityId, recipientAddress, recipientUsername }) => {
    await vault.withWorkspace(workspace => {
      const identityGroup = _getIdentityMessages({ identityId, workspace })
      const recipientGroup = _getRecipientMessages({ identityGroup, recipientAddress, recipientUsername, workspace })
      const [entry] = recipientGroup.getEntries().filter(e => e.toObject().properties.title === messageId.toString())
      if (entry) {
        entry.delete()
        workspace.save()
      }
    })
  }

  const updateMessage = async ({ messageId, identityId, recipientAddress, recipientUsername, newMessageStatus }) => {
    await vault.withWorkspace(workspace => {
      const identityGroup = _getIdentityMessages({ identityId, workspace })
      const recipientGroup = _getRecipientMessages({ identityGroup, recipientAddress, recipientUsername, workspace })
      const [entry] = recipientGroup.getEntries().filter(e => e.toObject().properties.title === messageId.toString())
      if (!entry) {
        throw new Error(`Message with id ${messageId} doesn't exist`)
      }
      entry.setProperty('status', newMessageStatus)
      workspace.save()
    })
  }

  const listMessages = async ({ identityId, recipientAddress, recipientUsername }) => {
    let messagesEntries = []
    let recipientGroup = null
    await vault.withWorkspace(workspace => {
      const identityGroup = _getIdentityMessages({ identityId, workspace })
      recipientGroup = _getRecipientMessages({ identityGroup, recipientAddress, recipientUsername, workspace })
      messagesEntries = recipientGroup.getEntries()
    })
    return {
      username: recipientGroup.getAttribute('username'),
      address: recipientGroup.getAttribute('address'),
      messages: processEntries(messagesEntries)
    }
  }

  const updateLastSeen = async ({ identityId, recipientAddress, recipientUsername, lastSeen }) => {
    await vault.withWorkspace(workspace => {
      const identityGroup = _getIdentityMessages({ identityId, workspace })
      const recipientGroup = _getRecipientMessages({ identityGroup, recipientAddress, recipientUsername, workspace })
      recipientGroup.setAttribute('lastSeen', `${lastSeen.toSeconds()}`)
      workspace.save()
    })
  }

  const getLastSeen = async ({ identityId, recipientAddress, recipientUsername }) => {
    let lastSeen = null
    await vault.withWorkspace(workspace => {
      const identityGroup = _getIdentityMessages({ identityId, workspace })
      const recipientGroup = _getRecipientMessages({ identityGroup, recipientAddress, recipientUsername, workspace })
      lastSeen = recipientGroup.getAttribute('lastSeen')
    })
    return DateTime.fromSeconds(parseInt(lastSeen))
  }

  return {
    saveMessage,
    listMessages,
    updateLastSeen,
    getLastSeen,
    deleteMessage,
    updateMessage
  }
}
