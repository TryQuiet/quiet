import { DateTime } from 'luxon'
import * as R from 'ramda'
import BigNumber from 'bignumber.js'

const _entryToMessage = (message) => {
  const entryObj = message.toObject()
  return {
    id: entryObj.properties.title,
    sender: {
      replyTo: entryObj.properties.sender,
      username: entryObj.properties.senderUsername
    },
    type: parseInt(entryObj.properties.type),
    message: entryObj.properties.message ? JSON.parse(entryObj.properties.message) : 'no message in vault', // until we update saving message to vault
    spent: new BigNumber(entryObj.properties.spent),
    createdAt: parseInt(entryObj.properties.createdAt),
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
      workspace.save()
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
      workspace.save()
      return createdRecipientGroup
    }
    return recipientGroup
  }

  const saveMessage = async ({ identityId, identityAddress, identityName, message, recipientAddress, recipientUsername, status, txId }) => {
    await vault.withWorkspace(workspace => {
      const identityGroup = _getIdentityMessages({ identityId, workspace })
      const recipientGroup = _getRecipientMessages({ identityGroup, recipientAddress, recipientUsername, workspace })
      recipientGroup.createEntry(txId)
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

  const loadAllSentMessages = async ({ identityId }) => {
    let messagesGroups = []
    await vault.withWorkspace(workspace => {
      const identityGroup = _getIdentityMessages({ identityId, workspace })
      messagesGroups = identityGroup.getGroups()
    })
    const initialMessages = await Promise.all(messagesGroups.map(async (group) => {
      const messages = await listMessages({ identityId, recipientAddress: group.getAttribute('address'), recipientUsername: group.getAttribute('username') })
      return messages
    }))
    return initialMessages
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
    const isDate = (value) => {
      if (!isNaN(value)) {
        return DateTime.fromSeconds(value)
      } else {
        return null
      }
    }
    return isDate(parseInt(lastSeen))
  }

  return {
    saveMessage,
    listMessages,
    updateLastSeen,
    getLastSeen,
    deleteMessage,
    updateMessage,
    loadAllSentMessages
  }
}
