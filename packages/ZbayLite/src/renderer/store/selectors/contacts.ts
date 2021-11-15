import { createSelector } from 'reselect'
// import identitySelectors from './identity'
// import usersSelectors from './users'
import { publicChannels } from '@zbayapp/nectar'
// import publicChannelsSelectors from './publicChannels'
// import { mergeIntoOne, displayableMessageLimit } from './channel'
// import { MessageType } from '../../../shared/static.types'
// import { unknownUserId } from '../../../shared/static'
// import { DisplayableMessage } from '../../zbay/messages.types'
import { Contact } from '../handlers/contacts'
import { Store } from '../reducers'
// import certificatesSelector from '../certificates/certificates.selector'
// import { CertFieldsTypes, extractPubKeyString, getCertFieldValue, loadCertificate } from '@zbayapp/identity'
// import channelSelector from '../selectors/channel'

const contacts = (s: Store) => s.contacts

const contactExists = (address: string) =>
  createSelector(contacts, allContacts => {
    return Object.keys(allContacts).includes(address)
  })

const publicChannelsContacts = createSelector(
  contacts,
  publicChannels.selectors.publicChannels,
  (allContacts, publicChannels) => {
    const pChannels = Object.values(publicChannels).map(pc => pc.address)
    return Object.values(allContacts).filter(contact => pChannels.includes(contact.address))
  }
)

const contactsList = createSelector(
  contacts,
  (contacts) => {
    return Array.from(Object.values(contacts)).filter(c => !c.address)
  }
)

const channelsList = createSelector(
  contacts,
  (contacts) => {
    return Array.from(Object.values(contacts)).filter(
      c => c.key.length === 78
    )
  }
)

const directMessagesContact = address =>
  createSelector(contacts, c => Array.from(Object.values(c)).find(el => el.address === address))

const contact = address =>
  createSelector(contacts, (c) => {
    if (!c[address]) {
      return new Contact({ username: 'unknown' })
    } else {
      return c[address]
    }
  }
  )

// const messagesSorted = address =>
//   createSelector(contact(address),  (c, u) => {
//     return Array.from(Object.values(c.messages))
//       .sort((a, b) => b.createdAt - a.createdAt)
//       .map(message => {
//         if (message.isUnregistered) {
//           return {
//             ...message,
//             sender: {
//               ...message.sender,
//               username: u[message.pubKey]?.nickname || message.sender.username
//             }
//           }
//         } else {
//           return message
//         }
//       })
//   })
// const messagesSortedDesc = address =>
//   createSelector(contact(address), c => {
//     return Array.from(Object.values(c.messages)).sort((a, b) => a.createdAt - b.createdAt)
//   })

const messagesLength = address =>
  createSelector(contact(address), c => {
    return Array.from(Object.values(c.messages)).length
  })
// const messages = address =>
//   createSelector(messagesSorted(address), displayableMessageLimit, (msgs, limit) => {
//     return msgs.slice(0, limit)
//   })

// const channelSettingsMessages = address =>
//   createSelector(messagesSortedDesc(address), msgs => {
//     return msgs.filter(msg => msg.type === 6)
//   })
// const channelModerators = address =>
//   createSelector(directMessages(address), msgs => {
//     return msgs.channelModerators
//   })

const allMessages = createSelector(contacts, c => {
  return Array.from(Object.keys(c)).reduce((acc, t) => {
    const temp = (acc[t] = {
      ...acc,
      ...c[t].messages
    })
    return temp
  }, {})
})
const allMessagesTxnId = createSelector(allMessages, c => {
  return new Set(Object.keys(c))
})
const getAdvertById = (txid: string) =>
  createSelector(allMessages, msgs => {
    return msgs[txid]
  })
const lastSeen = address => createSelector(contact(address), c => c.lastSeen)
const username = address => createSelector(contact(address), c => c.username)
const vaultMessages = address => createSelector(contact(address), c => c.vaultMessages)
const newMessages = address => createSelector(contact(address), c => c.newMessages)

// const channelOwner = channelId =>
//   createSelector(channelSettingsMessages(channelId), msgs => {
//     let channelOwner = null
//     channelOwner = msgs[0] ? msgs[0].pubKey : null
//     for (const msg of msgs) {
//       if (channelOwner === msg.pubKey) {
//         channelOwner = msg.owner
//       }
//     }
//     return channelOwner
//   })
// TODO: TO be removed
export interface IDirectMessage {
  visibleMessages: any[]
  channelModerators: string[]
  messsagesToRemove: any[]
  blockedUsers: string[]
}

// const currentChannel = createSelector(
//   contacts,
//   channelSelector.address,
//   channelSelector.id,
//   (contacts, address, id) => {
//     if (contacts[address]) {
//       return contacts[address]
//     } else {
//       return contacts[id]
//     }
//   }
// )

// const allChannels = createSelector(contacts, contacts => {
//   return contacts
// })

// const usersCertificateMapping = createSelector(
//   certificatesSelector.usersCertificates,
//   certificates => {
//     return certificates.reduce<{
//       [pubKey: string]: {
//         username: string
//         onionAddress: string
//         peerId: string
//         dmPublicKey: string
//       }
//     }>((acc, current) => {
//       let parsedCerficated
//       let certObject
//       let nickname = null
//       let onionAddress = null
//       let peerId = null
//       let dmPublicKey = null
//       if (current !== null && current) {
//         parsedCerficated = extractPubKeyString(current)
//         certObject = loadCertificate(current)
//         nickname = getCertFieldValue(certObject, CertFieldsTypes.nickName)
//         onionAddress = getCertFieldValue(certObject, CertFieldsTypes.commonName)
//         peerId = getCertFieldValue(certObject, CertFieldsTypes.peerId)
//         dmPublicKey = getCertFieldValue(certObject, CertFieldsTypes.dmPublicKey)
//       }
//       if (nickname && onionAddress && peerId && dmPublicKey) {
//         acc[parsedCerficated] = {
//           username: nickname,
//           onionAddress: onionAddress,
//           peerId: peerId,
//           dmPublicKey
//         }
//       }
//       return acc
//     }, {})
//   }
// )

// export const allMessagesOfChannelsWithUserInfo = createSelector(
//   allChannels,
//   usersCertificateMapping,
//   (allChannels, usersCertificateMapping) => {
//     if (!allChannels) return []

//     const channelsKeysArray = Object.keys(allChannels)

//     return channelsKeysArray.map(item => {
//       const messagesArray = Object.values(allChannels[item].messages)
//       return messagesArray
//         .map(message => {
//           if (usersCertificateMapping[message.pubKey]) {
//             const userInfo = usersCertificateMapping[message.pubKey]
//             if (userInfo.onionAddress !== null) {
//               return { message, userInfo: userInfo }
//             }
//           }
//         })
//         .filter(item => item !== undefined)
//     })
//   }
// )

// export const messagesOfChannelWithUserInfo = createSelector(
//   currentChannel,
//   usersCertificateMapping,
//   (currentChannel, usersCertificateMapping) => {
//     if (!currentChannel) return []
//     const messagesArray = Object.values(currentChannel.messages)
//     return messagesArray
//       .map(message => {
//         if (usersCertificateMapping[message.pubKey]) {
//           const userInfo = usersCertificateMapping[message.pubKey]
//           if (userInfo.onionAddress !== null && userInfo.dmPublicKey !== null) {
//             return ({ message, userInfo: userInfo })
//           }
//         }
//       })
//       .filter(item => item !== undefined)
//   }
// )

// export const directMessages = address =>
//   createSelector(
//     messagesOfChannelWithUserInfo,
//     channelOwner(address),
//     (messagesWithUserInfo, channelOwner): IDirectMessage => {
//       const messagesObjectsArray = messagesWithUserInfo.map(message => {
//         const newMessage = {
//           ...message.message,
//           createdAt: Math.floor(message.message.createdAt),
//           sender: {
//             username: message.userInfo ? message.userInfo.username : 'unNamed',
//             replyTo: ''
//           }
//         }
//         return newMessage
//       })
//            const sortedMessages = messagesObjectsArray
// .sort((a, b) => {
//   return b.createdAt - a.createdAt
// }).map(message => {
//   return {
//     ...message,
//     createdAt: Math.floor((message.createdAt / 1000))
//   }
// })

//       const messages = sortedMessages

//       const channelModerators = []
//       const messsagesToRemove: DisplayableMessage[] = []
//       const blockedUsers = []
//       let visibleMessages: DisplayableMessage[] = []
//       for (const msg of messages.reverse()) {
//         visibleMessages.push(msg)
//       }
//       const result: IDirectMessage = {
//         channelModerators,
//         messsagesToRemove,
//         blockedUsers,
//         visibleMessages: mergeIntoOne(visibleMessages.reverse())
//       }
//       return result
//     }
//   )

export default {
  contacts,
  contactExists,
  publicChannelsContacts,
  directMessagesContact,
  // channelModerators,
  contact,
  // messages,
  // directMessages,
  lastSeen,
  vaultMessages,
  username,
  newMessages,
  contactsList,
  channelsList,
  getAdvertById,
  allMessages,
  messagesLength,
  // messagesSorted,
  allMessagesTxnId
  // messagesOfChannelWithUserInfo,
  // allMessagesOfChannelsWithUserInfo,
  // usersCertificateMapping
}
