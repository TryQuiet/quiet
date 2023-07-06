import { keyFromCertificate, loadPrivateKey, parseCertificate, sign } from '@quiet/identity'
import logger from '../logger'
// import fs from 'fs'
// import os from 'os'
import { arrayBufferToString } from 'pvutils'
import { config } from '../../sagas/users/const/certFieldTypes'
import { type PeerId } from '@quiet/types'
const log = logger('test')

const notBeforeDate = new Date(Date.UTC(2010, 11, 28, 10, 10, 10))
const notAfterDate = new Date(Date.UTC(2030, 11, 28, 10, 10, 10))

export const createPeerIdTestHelper = (): PeerId => {
  return {
    id: 'QmWVMaUqEB73gzgGkc9wS7rnhNcpSyH64dmbGUdU2TM3eV',
    privKey:
      'CAASqAkwggSkAgEAAoIBAQCY2r7s5YlgWXlHuHH4PY/cUik/m7GuWPdTPmmm4QZTr1VSyKgC2AMR45xrcGMjd5SDh1HjzbptJpYfGWO+Sbm6yK7EfxYN8gOXrbo0koKtPH0hrgzus+CqUCAQDE6XWzY5yP7caFt/RolZaBYNcKCWDCHv+bg/87u3MGwwSeaMjYWNAQ5IVWrUFnns8eiyNRhBGrEQZDTyO4X0oMeEkTTABMEJIpge91SWfuYuqltiNdkS9aiYS58F43IBHKKWLc39b3KbiykiG2IjrqVl2aAyb6vSgtiGkwi301jtWEctaDl2JbwZpgldOA83wH2aBPK9N9MaakEYdI2dHVSg8bf9AgMBAAECggEAOH8JeIfyecE4WXDr9wPSC232vwLt7nIFoCf+ZubfLskscTenGb37jH4jT3avvekx5Fd8xgVBNZzAeegpfKjFVCtepVQPs8HS4BofK9VHJX6pBWzObN/hVzHcV/Ikjj7xUPRgdti/kNBibcBR/k+1myAK3ybemgydQj1Mj6CQ7Tu/4npaRXhVygasbTgFCYxrV+CGjzITdCAdRTWg1+H6puxjfObZqj0wa4I6sCom0+Eau7nULtVmi0hodOwKwtmc2oaUyCQY2yiEjdZnkXEEhP1EtJka+kD96iAG3YvFqlcdUPYVlIxCP9h55AaOShnACNymiTpYzpCP/kUK9wFkZQKBgQD2wjjWEmg8DzkD3y19MVZ71w0kt0PgZMU+alR8EZCJGqvoyi2wcinfdmqyOZBf2rct+3IyVpwuWPjsHOHq7ZaJGmJkTGrNbndTQ+WgwJDvghqBfHFrgBQNXvqHl5EuqnRMCjrJeP8Uud1su5zJbHQGsycZwPzB3fSj0yAyRO812wKBgQCelDmknQFCkgwIFwqqdClUyeOhC03PY0RGngp+sLlu8Q8iyEI1E9i/jTkjPpioAZ/ub5iD6iP5gj27N239B/elZY5xQQeDA4Ns+4yNOTx+nYXmWcTfVINFVe5AK824TjqlCY2ES+/hVBKB+JQV6ILlcCj5dXz9cCbg6cys4TttBwKBgH+rdaSs2WlZpvIt4mdHw6tHVPGOMHxFJxhoA1Y98D4/onpLQOBt8ORBbGrSBbTSgLw1wJvy29PPDNt9BhZ63swI7qdeMlQft3VJR+GoQFTrR7N/I1+vYLCaV50X+nHel1VQZaIgDDo5ACtl1nUQu+dLggt9IklcAVtRvPLFX87JAoGBAIBl8+ZdWc/VAPjr7y7krzJ/5VdYF8B716R2AnliDkLN3DuFelYPo8g1SLZI0MH3zs74fL0Sr94unl0gHGZsNRAuko8Q4EwsZBWx97PBTEIYuXox5T4O59sUILzEuuUoMkO+4F7mPWxs7i9eXkj+4j1z+zlA79slG9WweJDiLYOxAoGBAMmH/nv1+0sUIL2qgE7OBs8kokUwx4P8ZRAlL6ZVC4tVuDBL0zbjJKcQWOcpWQs9pC6O/hgPur3VgHDF7gko3ZDB0KuxVJPZyIhoo+PqXaCeq4KuIPESjYKT803p2S76n/c2kUaQ5i2lYToClvhk72kw9o9niSyVdotXxC90abI9',
    pubKey:
      'CAASpgIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCY2r7s5YlgWXlHuHH4PY/cUik/m7GuWPdTPmmm4QZTr1VSyKgC2AMR45xrcGMjd5SDh1HjzbptJpYfGWO+Sbm6yK7EfxYN8gOXrbo0koKtPH0hrgzus+CqUCAQDE6XWzY5yP7caFt/RolZaBYNcKCWDCHv+bg/87u3MGwwSeaMjYWNAQ5IVWrUFnns8eiyNRhBGrEQZDTyO4X0oMeEkTTABMEJIpge91SWfuYuqltiNdkS9aiYS58F43IBHKKWLc39b3KbiykiG2IjrqVl2aAyb6vSgtiGkwi301jtWEctaDl2JbwZpgldOA83wH2aBPK9N9MaakEYdI2dHVSg8bf9AgMBAAE=',
  }
}

export const createMessageSignatureTestHelper = async (
  message: string,
  certificate: string,
  userKey: string
): Promise<{ signature: string; pubKey: string }> => {
  const pubKey = keyFromCertificate(parseCertificate(certificate))
  const keyObject = await loadPrivateKey(userKey, config.signAlg)
  const signatureArrayBuffer = await sign(message, keyObject)
  const signature = arrayBufferToString(signatureArrayBuffer)
  return {
    signature,
    pubKey,
  }
}

export const lastActionReducer = (state: any[] = [], action: any) => {
  state.push(action.type)
  return state
}

// const messagesArr = [] // Replicated messages
// let peersArr = []
// const registrationTime = null // Time of receiving certificate
// let connectionTime = null // Time elasped between receiving certificate and connecting to peers.
// let channelReplicationTime = null // Time elapsed between connectiong to peers and replicating a channel
// let peerNumber = null // Peer number by joining order.

// export const collectDataReducer = (state = [], action: any) => {
//   switch (action.type) {
//     case 'Communities/storePeerList':
//       peerNumber = action.payload.peerList.length - 1
//       break
//     case 'PublicChannels/channelsReplicated':
//       // If you use spam-bot change channel name to channel bot spams on.
//       if (action.payload.channels?.['general']) {
//         const path = `${os.homedir()}/data-${state[0].nickname}.json`
//         channelReplicationTime = getCurrentTime()

//         const data = {
//           peerNumber,
//           connectionTime: connectionTime - registrationTime,
//           channelReplicationTime: channelReplicationTime - connectionTime
//         }

//         const jsonData = JSON.stringify(data)
//         fs.writeFileSync(path, jsonData)
//         // child_process.execSync('aws s3 cp /root/data-*.json s3://connected-peers')
//       }
//       break
//     case 'Identity/registerCertificate':
//       state.push({
//         nickname: action.payload.nickname
//       })
//       break
//     case 'Identity/storeUserCertificate':
//       const certificate = action.payload.userCertificate
//       const parsedCertificate = parseCertificate(certificate)
//       const pubKey = keyFromCertificate(parsedCertificate)
//       state[0].pubKey = pubKey
//       break
//     case 'Connection/addConnectedPeers':
//       console.log('Adding connected peers', action.payload)
//       peersArr = action.payload
//       connectionTime = getCurrentTime()
//       break
//     case 'Messages/incomingMessages':
//       const publicKey = state[0].pubKey
//       const messages: ChannelMessage[] = action.payload.messages

//       const path = `${os.homedir()}/data-${state[0].nickname}.json`

//       messages.forEach(message => {
//         if (
//           message.message.startsWith('Created') ||
//           message.message.startsWith('@') ||
//           message.pubKey === publicKey
//         ) { return }

//         const currentTime = getCurrentTime()
//         const delay = currentTime - message.createdAt

//         const data = {
//           [message.id]: delay
//         }

//         messagesArr.push(data)

//         if (messagesArr.length === 1) {
//           const jsonData = JSON.stringify(messagesArr)
//           fs.writeFileSync(path, jsonData)
//           // child_process.execSync('aws s3 cp /root/data-*.json s3://quiet-performance-data')
//         }

//         if (messagesArr.length === 500) {
//           const jsonData = JSON.stringify(messagesArr)
//           fs.writeFileSync(path, jsonData)
//           // child_process.execSync('aws s3 cp /root/data-*.json s3://quiet-performance-data-1-message')
//         }
//       })
//       break
//   }
//   return state
// }

export default {
  createPeerIdTestHelper,
  createMessageSignatureTestHelper,
  lastActionReducer,
  // collectDataReducer
}
