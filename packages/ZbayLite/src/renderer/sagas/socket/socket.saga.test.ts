import { expectSaga } from 'redux-saga-test-plan'
import { combineReducers } from 'redux'
import { addCertificate, computeSecrets, converstionFilter, createRandomId, encryptMessage, getCreatedAtTime, getPublicKey, parseMessage, sendDirectMessage, sendMessage, signArrayBufferToString } from './socket.saga'
import { StoreKeys } from '../../store/store.keys'
import {
  certificatesActions,
  certificatesReducer,
  CertificatesState
} from '../../store/certificates/certificates.reducer'
import identity, { Identity } from '../../store/handlers/identity'
import { Socket } from 'socket.io-client'
import * as matchers from 'redux-saga-test-plan/matchers'
import { extractPubKeyString, parseCertificate } from '@zbayapp/identity'
import { publicChannelsActions } from '../publicChannels/publicChannels.reducer'
import channel, { Channel } from '../../store/handlers/channel'
import { Socket as socketsActions } from '../const/actionsTypes'
import { IMessage } from '../../zbay/messages.types'
import directMessages, { DirectMessages } from '../../store/handlers/directMessages'
import {
  directMessagesActions
} from '../directMessages/directMessages.reducer'
import users, { User } from '../../store/handlers/users'
import produce from 'immer'

describe('checkCertificatesSaga', () => {
  test('adds certificate if there is no certificate', async () => {
    const initialState = {
      [StoreKeys.Certificates]: {
        ...new CertificatesState(),
        ownCertificate: {
          certificate: '',
          privateKey: ''
        }
      },
      [StoreKeys.Identity]: {
        ...new Identity(),
        registrationStatus: {
          nickname: 'nickname',
          status: '',
          takenUsernames: ['']
        }
      }
    }

    await expectSaga(addCertificate)
      .withReducer(
        combineReducers({
          [StoreKeys.Certificates]: certificatesReducer,
          [StoreKeys.Identity]: identity.reducer
        }),
        initialState
      )
      .put(certificatesActions.createOwnCertificate('nickname'))
      .hasFinalState(initialState)
      .run()
  })

  test("doesn't add certificate if there already is a certificate", async () => {
    const initialState = {
      [StoreKeys.Certificates]: {
        ...new CertificatesState(),
        ownCertificate: {
          certificate: 'some certificate',
          privateKey: ''
        }
      },
      [StoreKeys.Identity]: {
        ...new Identity(),
        registrationStatus: {
          nickname: 'nickname',
          status: '',
          takenUsernames: ['']
        }
      }
    }

    const parsedCert = {
      subject: {
        typesAndValues: ['commonName', 'zbayNickname', 'peerId', 'dmPublicKey'] // cert fields
      }
    }
    const runResult = await expectSaga(addCertificate)
      .withReducer(
        combineReducers({
          [StoreKeys.Certificates]: certificatesReducer,
          [StoreKeys.Identity]: identity.reducer
        }),
        initialState
      )
      .provide([
        [
          matchers.call(parseCertificate, 'some certificate'),
          parsedCert
        ]
      ])
      .hasFinalState(initialState)
      .run()

    expect(runResult.effects.put).toBeUndefined()
  })

  test('send public channel message', async () => {
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket
    const randomId = 'randomId'
    const createdAt = 10000
    const address = 'address'
    const publicKey = 'publicKey'
    const signatureString = 'signatureString'
    const message = '' as IMessage

    const initialState = {
      [StoreKeys.Certificates]: {
        ...new CertificatesState(),
        ownCertificate: {
          certificate: 'MIIBmzCCAUECBgF6gbgdQjAKBggqhkjOPQQDAjASMRAwDgYDVQQDEwdaYmF5IENBMB4XDTIxMDcwNzE2MDYwNFoXDTMwMTIzMTIzMDAwMFowfTF7MCIGCisGAQQBg4wbAgETFGRldjk5ZGFtaWFudGVzdHl5dWVyMD8GA1UEAxM4Y3FpMjVmb3VweGFqdzd2aTdzeTUyaGo1d2R3cXZmcXpiajVzenFwczZ6NmJndWMzN2ZidjJpaWQwFAYJKwYBAgEPAwEBEwd1bmtub3duMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE6MOsBzPsKQpNbfNfSfT4TMF21nFub2L09cG9U/pfzZlnIydm1S3hU0MczixzEHml86Wne5wWNLTG381womS7yKMdMBswDAYDVR0TBAUwAwIBAzALBgNVHQ8EBAMCAAYwCgYIKoZIzj0EAwIDSAAwRQIhAMD+OU2mSakkuE6pU6gPr12eRAFGUK7usfyKmTFbCLH/AiB8IRuvOuNcjj87Aoz9kDcbe7CHx+ogean9aFFmmDNx/A==',
          privateKey: 'MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgZ3WYzRL626KcbhJlYzasix819MaxrlKChJ4seDy3+UKgCgYIKoZIzj0DAQehRANCAATow6wHM+wpCk1t819J9PhMwXbWcW5vYvT1wb1T+l/NmWcjJ2bVLeFTQxzOLHMQeaXzpad7nBY0tMbfzXCiZLvI'
        }
      },
      [StoreKeys.Identity]: {
        ...new Identity(),
        registrationStatus: {
          nickname: 'nickname',
          status: '',
          takenUsernames: ['']
        }
      },
      [StoreKeys.Channel]: {
        ...new Channel(),
        message: {
          [randomId]: message
        },
        address: address
      }
    }

    await expectSaga(sendMessage, socket)
      .withReducer(
        combineReducers({
          [StoreKeys.Certificates]: certificatesReducer,
          [StoreKeys.Identity]: identity.reducer,
          [StoreKeys.Channel]: channel.reducer
        }),
        initialState
      )
      .provide([
        [
          matchers.call(extractPubKeyString, 'MIIBmzCCAUECBgF6gbgdQjAKBggqhkjOPQQDAjASMRAwDgYDVQQDEwdaYmF5IENBMB4XDTIxMDcwNzE2MDYwNFoXDTMwMTIzMTIzMDAwMFowfTF7MCIGCisGAQQBg4wbAgETFGRldjk5ZGFtaWFudGVzdHl5dWVyMD8GA1UEAxM4Y3FpMjVmb3VweGFqdzd2aTdzeTUyaGo1d2R3cXZmcXpiajVzenFwczZ6NmJndWMzN2ZidjJpaWQwFAYJKwYBAgEPAwEBEwd1bmtub3duMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE6MOsBzPsKQpNbfNfSfT4TMF21nFub2L09cG9U/pfzZlnIydm1S3hU0MczixzEHml86Wne5wWNLTG381womS7yKMdMBswDAYDVR0TBAUwAwIBAzALBgNVHQ8EBAMCAAYwCgYIKoZIzj0EAwIDSAAwRQIhAMD+OU2mSakkuE6pU6gPr12eRAFGUK7usfyKmTFbCLH/AiB8IRuvOuNcjj87Aoz9kDcbe7CHx+ogean9aFFmmDNx/A=='),
          publicKey
        ],
        [
          matchers.call(createRandomId),
          randomId
        ],
        [
          matchers.call(getCreatedAtTime),
          createdAt
        ],
        [
          matchers.call.fn(signArrayBufferToString),
          signatureString
        ]
      ])
      .put(
        publicChannelsActions.addMessage({
          key: address,
          message: {
            [randomId]: {
              channelId: address,
              createdAt: createdAt,
              id: randomId,
              pubKey: publicKey,
              signature: signatureString,
              type: 1,
              message: message
            }
          }
        })
      )
      .apply(socket, socket.emit, [
        socketsActions.SEND_MESSAGE,
        {
          channelAddress: address,
          message: {
            channelId: address,
            createdAt: createdAt,
            id: randomId,
            pubKey: publicKey,
            signature: signatureString,
            type: 1,
            message: message
          }
        }
      ])
      .hasFinalState(initialState)
      .run()
  })

  test('send direct message when conversation egsist', async () => {
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket
    const randomId = 'randomId'
    const createdAt = 10000
    const address = 'address'
    const message = '' as IMessage
    const encryptedMessage = 'encryptedMessage'
    const conversationId = 'conversationId'

    const identityStore = new Identity()

    const convs = {
      randomId: {
        conversationId: conversationId,
        sharedSecret: 'sharedSecret',
        contactPublicKey: 'contactPublicKey'
      }
    }

    const initialState = {
      [StoreKeys.Certificates]: {
        ...new CertificatesState(),
        ownCertificate: {
          certificate: 'MIIBmzCCAUECBgF6gbgdQjAKBggqhkjOPQQDAjASMRAwDgYDVQQDEwdaYmF5IENBMB4XDTIxMDcwNzE2MDYwNFoXDTMwMTIzMTIzMDAwMFowfTF7MCIGCisGAQQBg4wbAgETFGRldjk5ZGFtaWFudGVzdHl5dWVyMD8GA1UEAxM4Y3FpMjVmb3VweGFqdzd2aTdzeTUyaGo1d2R3cXZmcXpiajVzenFwczZ6NmJndWMzN2ZidjJpaWQwFAYJKwYBAgEPAwEBEwd1bmtub3duMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE6MOsBzPsKQpNbfNfSfT4TMF21nFub2L09cG9U/pfzZlnIydm1S3hU0MczixzEHml86Wne5wWNLTG381womS7yKMdMBswDAYDVR0TBAUwAwIBAzALBgNVHQ8EBAMCAAYwCgYIKoZIzj0EAwIDSAAwRQIhAMD+OU2mSakkuE6pU6gPr12eRAFGUK7usfyKmTFbCLH/AiB8IRuvOuNcjj87Aoz9kDcbe7CHx+ogean9aFFmmDNx/A==',
          privateKey: 'MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgZ3WYzRL626KcbhJlYzasix819MaxrlKChJ4seDy3+UKgCgYIKoZIzj0DAQehRANCAATow6wHM+wpCk1t819J9PhMwXbWcW5vYvT1wb1T+l/NmWcjJ2bVLeFTQxzOLHMQeaXzpad7nBY0tMbfzXCiZLvI'
        }
      },
      [StoreKeys.Identity]: {
        ...new Identity(),
        registrationStatus: {
          nickname: 'nicknamme',
          status: '',
          takenUsernames: ['']
        },
        data: {
          signerPubKey: 'pubKey',
          ...identityStore.data
        }
      },
      [StoreKeys.Channel]: {
        ...new Channel(),
        message: {
          [randomId]: message
        },
        address: address,
        id: randomId
      },
      [StoreKeys.DirectMessages]: {
        ...new DirectMessages(),
        conversations: {
          randomId: {
            conversationId: conversationId,
            sharedSecret: 'sharedSecret',
            contactPublicKey: 'contactPublicKey'
          }
        }
      },
      [StoreKeys.Users]: {
        userid: {
          ...new User({ nickname: 'nickname' })
        }
      }
    }

    const runResult = await expectSaga(sendDirectMessage, socket)
      .withReducer(
        combineReducers({
          [StoreKeys.Certificates]: certificatesReducer,
          [StoreKeys.Identity]: identity.reducer,
          [StoreKeys.Channel]: channel.reducer,
          [StoreKeys.DirectMessages]: directMessages.reducer
        }),
        initialState
      )
      .provide([
        [
          matchers.call(converstionFilter, convs, 'randomId'),
          [{
            conversationId: conversationId,
            sharedSecret: 'sharedSecret',
            contactPublicKey: 'contactPublicKey'
          }]
        ],
        [
          matchers.call(createRandomId),
          randomId
        ],
        [
          matchers.call(getCreatedAtTime),
          createdAt
        ],
        [
          matchers.call.fn(encryptMessage),
          encryptedMessage
        ]
      ])

      .apply(socket, socket.emit, [
        socketsActions.SEND_DIRECT_MESSAGE,
        {
          channelAddress: conversationId,
          message: encryptedMessage
        }
      ])
      .hasFinalState(
        initialState
      )
      .run()

    expect(runResult.effects.put).toBeUndefined()
  })

  test('send direct message with initialize conversation', async () => {
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket
    const randomId = 'randomId'
    const address = 'address'
    const message = '' as IMessage
    const encryptedMessage = 'encryptedMessage'
    const encryptedPhrase = 'encryptedPhrase'
    const conversationId = 'conversationId'
    const contactPublicKey = 'contactPublicKey'

    const identityStore = new Identity()

    const conversation = {
      sharedSecret: 'sharedSecret',
      contactPublicKey: contactPublicKey,
      conversationId: conversationId
    }

    const user = {
      nickname: 'nickname',
      publicKey: contactPublicKey,
      halfKey: 'halfKey'
    }

    const initialState = {
      [StoreKeys.Certificates]: {
        ...new CertificatesState(),
        ownCertificate: {
          certificate: 'MIIBmzCCAUECBgF6gbgdQjAKBggqhkjOPQQDAjASMRAwDgYDVQQDEwdaYmF5IENBMB4XDTIxMDcwNzE2MDYwNFoXDTMwMTIzMTIzMDAwMFowfTF7MCIGCisGAQQBg4wbAgETFGRldjk5ZGFtaWFudGVzdHl5dWVyMD8GA1UEAxM4Y3FpMjVmb3VweGFqdzd2aTdzeTUyaGo1d2R3cXZmcXpiajVzenFwczZ6NmJndWMzN2ZidjJpaWQwFAYJKwYBAgEPAwEBEwd1bmtub3duMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE6MOsBzPsKQpNbfNfSfT4TMF21nFub2L09cG9U/pfzZlnIydm1S3hU0MczixzEHml86Wne5wWNLTG381womS7yKMdMBswDAYDVR0TBAUwAwIBAzALBgNVHQ8EBAMCAAYwCgYIKoZIzj0EAwIDSAAwRQIhAMD+OU2mSakkuE6pU6gPr12eRAFGUK7usfyKmTFbCLH/AiB8IRuvOuNcjj87Aoz9kDcbe7CHx+ogean9aFFmmDNx/A==',
          privateKey: 'MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgZ3WYzRL626KcbhJlYzasix819MaxrlKChJ4seDy3+UKgCgYIKoZIzj0DAQehRANCAATow6wHM+wpCk1t819J9PhMwXbWcW5vYvT1wb1T+l/NmWcjJ2bVLeFTQxzOLHMQeaXzpad7nBY0tMbfzXCiZLvI'
        }
      },
      [StoreKeys.Identity]: {
        ...new Identity(),
        registrationStatus: {
          nickname: 'nicknamme',
          status: '',
          takenUsernames: ['']
        },
        data: {
          signerPubKey: 'pubKey',
          ...identityStore.data
        }
      },
      [StoreKeys.Channel]: {
        ...new Channel(),
        message: {
          [randomId]: message
        },
        address: address,
        id: contactPublicKey
      },
      [StoreKeys.DirectMessages]: {
        ...new DirectMessages(),
        conversations: {

        },
        users: {
          contactPublicKey: user
        }
      },
      [StoreKeys.Users]: {
        contactPublicKey: new User({ publicKey: contactPublicKey })
      }
    }

    const expectedState = produce(initialState, state => {
      state.directMessages = {
        ...new DirectMessages(),
        conversations: {
          conversationId: conversation
        },
        users: {
          contactPublicKey: user
        }
      }
    })

    await expectSaga(sendDirectMessage, socket)
      .withReducer(
        combineReducers({
          [StoreKeys.Certificates]: certificatesReducer,
          [StoreKeys.Identity]: identity.reducer,
          [StoreKeys.Channel]: channel.reducer,
          [StoreKeys.DirectMessages]: directMessages.reducer,
          [StoreKeys.Users]: users.reducer
        }),
        initialState
      )
      .provide([
        [
          matchers.call(converstionFilter, {}, 'randomId'),
          []
        ],
        [
          matchers.call.fn(computeSecrets),
          'sharedSecret'
        ],
        [
          matchers.call.fn(getPublicKey),
          conversationId
        ],
        [
          matchers.call(encryptMessage, 'sharedSecret', 'no panicpubKey'),
          encryptedMessage
        ],
        [
          matchers.call.fn(parseMessage),
          'parsedMessage'
        ],
        [
          matchers.call(encryptMessage, 'sharedSecret', 'parsedMessage'),
          encryptedPhrase
        ],
        [
          matchers.call(converstionFilter, {}, 'randomId'),
          [conversation]
        ]
      ])
      .put(
        directMessages.actions.addConversation(conversation)
      )
      .put(
        directMessagesActions.initializeConversation({
          address: conversationId,
          encryptedPhrase: encryptedMessage
        })
      )
      .apply(socket, socket.emit, [
        socketsActions.SEND_DIRECT_MESSAGE,
        {
          channelAddress: conversationId,
          message: encryptedPhrase
        }
      ])
      .hasFinalState(expectedState)
      .run()
  })
})
