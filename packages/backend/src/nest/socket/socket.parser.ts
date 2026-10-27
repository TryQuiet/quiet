import * as socketIoParser from 'socket.io-parser'

// socket.io-parser >= 4.2.6 rejects packets with more than 10 binary attachments by default. QSS sync batches
// carry one buffer per log entry, so keep a bounded but much higher cap instead of the default.
export const MAX_SOCKET_ATTACHMENTS = 1000

class QuietDecoder extends socketIoParser.Decoder {
  constructor() {
    super({ maxAttachments: MAX_SOCKET_ATTACHMENTS })
  }
}

export const quietSocketParser = {
  protocol: socketIoParser.protocol,
  Encoder: socketIoParser.Encoder,
  Decoder: QuietDecoder,
}
