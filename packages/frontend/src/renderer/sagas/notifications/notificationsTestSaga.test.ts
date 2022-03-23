import { setupCrypto } from '@quiet/identity'
import { communities, connection, getFactory, identity, IncomingMessages, NotificationsOptions, NotificationsSounds, prepareStore, publicChannels, settings, users } from '@quiet/nectar'
import { Action } from 'redux-actions'
import { testSaga } from 'redux-saga-test-plan'
import { displayMessageNotificationSaga, bridgeAction, messagesMapForNotificationsCalls, createNotificationsCallsDataType } from './notifications'

let incomingMessages: IncomingMessages
let store
let publicChannel2

beforeAll(async () => {
  setupCrypto()
  store = await prepareStore()
  const factory = await getFactory(store.store)

  const community1 = await factory.create<
  ReturnType<typeof communities.actions.addNewCommunity>['payload']
  >('Community')

  publicChannel2 = await factory.create<
  ReturnType<typeof publicChannels.actions.addChannel>['payload']
  >('PublicChannel', { communityId: community1.id })

  await factory.create<
  ReturnType<typeof identity.actions.addNewIdentity>['payload']
  >('Identity', { id: community1.id, nickname: 'alice' })

  incomingMessages = {
    messages: [{
      id: 'id',
      type: 1,
      message: 'message',
      createdAt: 1000000,
      channelAddress: publicChannel2.channel.address,
      signature: 'signature',
      pubKey: 'pubKey'
    }],
    communityId: '1'
  }
})

describe('displayMessageNotificationSaga', () => {
  const incomingMessages: IncomingMessages = {
    messages: [{
      id: 'id',
      type: 1,
      message: 'message',
      createdAt: 1000000,
      channelAddress: 'channelAddress',
      signature: 'signature',
      pubKey: 'pubKey'
    }],
    communityId: 'communityId'
  }

  const messagesMapCallData: createNotificationsCallsDataType = {
    action: {
      type: 'PublicChannels/incomingMessages',
      payload: incomingMessages
    },
    publicChannels: [
      {
        name: 'general',
        description: 'description',
        owner: 'user',
        timestamp: 0,
        address: 'general'
      },
      {
        name: 'channelId',
        description: 'description',
        owner: 'user',
        timestamp: 0,
        address: 'channelId'
      }
    ],
    usersData: {
      'BGpIcx0Ds4/m0qhK+EZcwZMLb6k806ddVaMT64nxee5d2/BKJWXp+2VqA6D31PXliV6jRgCXGAbgB2/jOjQ8WWM=': {
        username: 'alice',
        onionAddress: 'putnxiwutblglde5i2mczpo37h5n4dvoqkqg2mkxzov7riwqu2owiaid.onion',
        peerId: 'QmWVMaUqEB73gzgGkc9wS7rnhNcpSyH64dmbGUdU2TM3eV',
        dmPublicKey: ''
      }
    },
    myIdentity: {
      hiddenService: {
        onionAddress: 'putnxiwutblglde5i2mczpo37h5n4dvoqkqg2mkxzov7riwqu2owiaid.onion',
        privateKey: 'ED25519-V3:WND1FoFZyY+c1f0uD6FBWgKvSYl4CdKSizSR7djRekW/rqw5fTw+gN80sGk0gl01sL5i25noliw85zF1BUBRDQ=='
      },
      peerId: {
        id: 'QmWVMaUqEB73gzgGkc9wS7rnhNcpSyH64dmbGUdU2TM3eV',
        privKey: 'CAASqAkwggSkAgEAAoIBAQCY2r7s5YlgWXlHuHH4PY/cUik/m7GuWPdTPmmm4QZTr1VSyKgC2AMR45xrcGMjd5SDh1HjzbptJpYfGWO+Sbm6yK7EfxYN8gOXrbo0koKtPH0hrgzus+CqUCAQDE6XWzY5yP7caFt/RolZaBYNcKCWDCHv+bg/87u3MGwwSeaMjYWNAQ5IVWrUFnns8eiyNRhBGrEQZDTyO4X0oMeEkTTABMEJIpge91SWfuYuqltiNdkS9aiYS58F43IBHKKWLc39b3KbiykiG2IjrqVl2aAyb6vSgtiGkwi301jtWEctaDl2JbwZpgldOA83wH2aBPK9N9MaakEYdI2dHVSg8bf9AgMBAAECggEAOH8JeIfyecE4WXDr9wPSC232vwLt7nIFoCf+ZubfLskscTenGb37jH4jT3avvekx5Fd8xgVBNZzAeegpfKjFVCtepVQPs8HS4BofK9VHJX6pBWzObN/hVzHcV/Ikjj7xUPRgdti/kNBibcBR/k+1myAK3ybemgydQj1Mj6CQ7Tu/4npaRXhVygasbTgFCYxrV+CGjzITdCAdRTWg1+H6puxjfObZqj0wa4I6sCom0+Eau7nULtVmi0hodOwKwtmc2oaUyCQY2yiEjdZnkXEEhP1EtJka+kD96iAG3YvFqlcdUPYVlIxCP9h55AaOShnACNymiTpYzpCP/kUK9wFkZQKBgQD2wjjWEmg8DzkD3y19MVZ71w0kt0PgZMU+alR8EZCJGqvoyi2wcinfdmqyOZBf2rct+3IyVpwuWPjsHOHq7ZaJGmJkTGrNbndTQ+WgwJDvghqBfHFrgBQNXvqHl5EuqnRMCjrJeP8Uud1su5zJbHQGsycZwPzB3fSj0yAyRO812wKBgQCelDmknQFCkgwIFwqqdClUyeOhC03PY0RGngp+sLlu8Q8iyEI1E9i/jTkjPpioAZ/ub5iD6iP5gj27N239B/elZY5xQQeDA4Ns+4yNOTx+nYXmWcTfVINFVe5AK824TjqlCY2ES+/hVBKB+JQV6ILlcCj5dXz9cCbg6cys4TttBwKBgH+rdaSs2WlZpvIt4mdHw6tHVPGOMHxFJxhoA1Y98D4/onpLQOBt8ORBbGrSBbTSgLw1wJvy29PPDNt9BhZ63swI7qdeMlQft3VJR+GoQFTrR7N/I1+vYLCaV50X+nHel1VQZaIgDDo5ACtl1nUQu+dLggt9IklcAVtRvPLFX87JAoGBAIBl8+ZdWc/VAPjr7y7krzJ/5VdYF8B716R2AnliDkLN3DuFelYPo8g1SLZI0MH3zs74fL0Sr94unl0gHGZsNRAuko8Q4EwsZBWx97PBTEIYuXox5T4O59sUILzEuuUoMkO+4F7mPWxs7i9eXkj+4j1z+zlA79slG9WweJDiLYOxAoGBAMmH/nv1+0sUIL2qgE7OBs8kokUwx4P8ZRAlL6ZVC4tVuDBL0zbjJKcQWOcpWQs9pC6O/hgPur3VgHDF7gko3ZDB0KuxVJPZyIhoo+PqXaCeq4KuIPESjYKT803p2S76n/c2kUaQ5i2lYToClvhk72kw9o9niSyVdotXxC90abI9',
        pubKey: 'CAASpgIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCY2r7s5YlgWXlHuHH4PY/cUik/m7GuWPdTPmmm4QZTr1VSyKgC2AMR45xrcGMjd5SDh1HjzbptJpYfGWO+Sbm6yK7EfxYN8gOXrbo0koKtPH0hrgzus+CqUCAQDE6XWzY5yP7caFt/RolZaBYNcKCWDCHv+bg/87u3MGwwSeaMjYWNAQ5IVWrUFnns8eiyNRhBGrEQZDTyO4X0oMeEkTTABMEJIpge91SWfuYuqltiNdkS9aiYS58F43IBHKKWLc39b3KbiykiG2IjrqVl2aAyb6vSgtiGkwi301jtWEctaDl2JbwZpgldOA83wH2aBPK9N9MaakEYdI2dHVSg8bf9AgMBAAE='
      },
      dmKeys: {
        publicKey: '9f016defcbe48829db163e86b28efb10318faf3b109173105e3dc024e951bb1b',
        privateKey: '4dcebbf395c0e9415bc47e52c96fcfaf4bd2485a516f45118c2477036b45fc0b'
      },
      id: '1',
      nickname: 'alice',
      userCsr: {
        userCsr: 'MIIBnTCCAUMCAQAwSTFHMEUGA1UEAxM+cHV0bnhpd3V0YmxnbGRlNWkybWN6cG8zN2g1bjRkdm9xa3FnMm1reHpvdjdyaXdxdTJvd2lhaWQub25pb24wWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAARqSHMdA7OP5tKoSvhGXMGTC2+pPNOnXVWjE+uJ8XnuXdvwSiVl6ftlagOg99T15Yleo0YAlxgG4Adv4zo0PFljoIGXMC4GCSqGSIb3DQEJDjEhMB8wHQYDVR0OBBYEFBwPHypD935SgTKAft3XGWHl0ffRMA8GCSqGSIb3DQEJDDECBAAwFQYKKwYBBAGDjBsCATEHEwVhbGljZTA9BgkrBgECAQ8DAQExMBMuUW1XVk1hVXFFQjczZ3pnR2tjOXdTN3JuaE5jcFN5SDY0ZG1iR1VkVTJUTTNlVjAKBggqhkjOPQQDAgNIADBFAiEAl39WSOInUuXC5HnAt+zVQuClLOTp/n0ivwolchNez5wCIAvU/6yYXyFjiZ912PImgFL+pt/f+05dxkD9f10cIdlL',
        userKey: 'MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgYWFCmiHdt3s2h1JfnLcZ9zb1M9q2TCgZOCcex8p7+d+gCgYIKoZIzj0DAQehRANCAARqSHMdA7OP5tKoSvhGXMGTC2+pPNOnXVWjE+uJ8XnuXdvwSiVl6ftlagOg99T15Yleo0YAlxgG4Adv4zo0PFlj',
        pkcs10: {
          pkcs10: ['CertificationRequest'],
          publicKey: ['CryptoKey'],
          privateKey: ['CryptoKey']
        }
      },
      userCertificate: 'MIIB5DCCAYsCBgF+/ot9tDAKBggqhkjOPQQDAjALMQkwBwYDVQQDEwAwHhcNMTAxMjI4MTAxMDEwWhcNMzAxMjI4MTAxMDEwWjBJMUcwRQYDVQQDEz5wdXRueGl3dXRibGdsZGU1aTJtY3pwbzM3aDVuNGR2b3FrcWcybWt4em92N3Jpd3F1Mm93aWFpZC5vbmlvbjBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABGpIcx0Ds4/m0qhK+EZcwZMLb6k806ddVaMT64nxee5d2/BKJWXp+2VqA6D31PXliV6jRgCXGAbgB2/jOjQ8WWOjgaEwgZ4wCQYDVR0TBAIwADALBgNVHQ8EBAMCAI4wHQYDVR0lBBYwFAYIKwYBBQUHAwIGCCsGAQUFBwMBMA8GCSqGSIb3DQEJDAQCBAAwFQYKKwYBBAGDjBsCAQQHEwVhbGljZTA9BgkrBgECAQ8DAQEEMBMuUW1XVk1hVXFFQjczZ3pnR2tjOXdTN3JuaE5jcFN5SDY0ZG1iR1VkVTJUTTNlVjAKBggqhkjOPQQDAgNHADBEAiAGwhjFKKkqYKE3r4VVbl5IDe/Fta9+3lsY9Veegu0BlwIgdvis9mPAr0VOUeMRMWc3vVjyDlZqSdiXgcLxzdESKYA='
    },
    currentChannel: 'general',
    notificationsOption: NotificationsOptions.notifyForEveryMessage,
    notificationsSound: NotificationsSounds.pow,
    lastConnectedTime: 1000
  }

  const channel: () => Action<any> = () => ({ payload: {}, type: 'some-type' })

  function mainPath() {
    return testSaga(displayMessageNotificationSaga, { payload: incomingMessages, type: 'PublicChannels/incomingMessages' })
      .next()
      .select(publicChannels.selectors.publicChannels)
      .next(messagesMapCallData.publicChannels)
      .select(users.selectors.certificatesMapping)
      .next(messagesMapCallData.usersData)
      .select(identity.selectors.currentIdentity)
      .next(messagesMapCallData.myIdentity)
      .select(publicChannels.selectors.currentChannel)
      .next(messagesMapCallData.currentChannel)
      .select(settings.selectors.getNotificationsOption)
      .next(messagesMapCallData.notificationsOption)
      .select(settings.selectors.getNotificationsSound)
      .next(messagesMapCallData.notificationsSound)
      .select(connection.selectors.lastConnectedTime)
      .next(messagesMapCallData.lastConnectedTime)
      .call(messagesMapForNotificationsCalls, messagesMapCallData)
      .next(channel)
      .takeEvery(channel, bridgeAction)
      .next()
      .isDone()
  }
  it('test saga steps', () => {
    mainPath()
  })
})
