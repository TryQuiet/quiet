import SocketIO from 'socket.io'
import { SocketActionTypes } from '@zbayapp/nectar'
import logger from '../../logger'

const log = logger('socket')

export const loadCertificates = (socket: SocketIO.Server, certificates: string[]) => {
  log(`Sending back ${certificates.length} certificates`)
  socket.emit(SocketActionTypes.RESPONSE_GET_CERTIFICATES, {
    certificates
  })
}
