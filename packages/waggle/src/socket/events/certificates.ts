import { EventTypesResponse } from '../constantsReponse'
import logger from '../../logger'
const log = logger('socket')

export const loadCertificates = (socket: SocketIO.Server, certificates: string[]) => {
  log(`Sending back ${certificates.length} certificates`)
  socket.emit(EventTypesResponse.RESPONSE_GET_CERTIFICATES, {
    certificates
  })
}
