// import { Socket } from 'socket.io-client'
// import { PayloadAction } from '@reduxjs/toolkit'
// import { call, select, apply, put } from 'typed-redux-saga'
// import { SocketActionTypes } from '../../socket/const/actionTypes'
// import { identitySelectors } from '../../identity/identity.selectors'
// import { messagesActions } from '../messages.slice'
// import { Identity } from '../../identity/identity.types'
// import { FileContent } from '../../files/files.types'

// export function* uploadedFileSaga(
//   socket: Socket,
//   action: PayloadAction<ReturnType<typeof messagesActions.uploadedFile>['payload']>
// ): Generator {
//   // const identity: Identity = yield* select(identitySelectors.currentIdentity)

//   // const fileContent: FileContent = action.payload

//   // cid
//   console.log('uploadedFileSaga', action.payload)
//   yield* put(messagesActions.sendFile({
//     message: action.payload.buffer,
//     channelAddress: action.payload.dir,
//     cid: action.payload.cid
//   }))
// }
