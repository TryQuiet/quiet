import { Encoder, Decoder, PacketType } from 'socket.io-parser'
import { quietSocketParser, MAX_SOCKET_ATTACHMENTS } from './socket.parser'

const decodeBinaryPacket = (decoder: Decoder, attachments: number) => {
  const packet = {
    type: PacketType.EVENT,
    nsp: '/',
    data: ['sync', ...Array.from({ length: attachments }, (_, i) => new Uint8Array([i]))],
  }
  const encoded = new Encoder().encode(packet)
  return new Promise<any>((resolve, reject) => {
    decoder.on('decoded', resolve)
    try {
      for (const chunk of encoded) decoder.add(chunk)
    } catch (e) {
      reject(e)
    }
  })
}

describe('quietSocketParser', () => {
  it('accepts more binary attachments than the socket.io-parser default of 10', async () => {
    const decoded = await decodeBinaryPacket(new quietSocketParser.Decoder(), 50)
    expect(decoded.data).toHaveLength(51)
  })

  it('still rejects packets above the configured cap', async () => {
    await expect(decodeBinaryPacket(new quietSocketParser.Decoder(), MAX_SOCKET_ATTACHMENTS + 1)).rejects.toThrow(
      'too many attachments'
    )
  })

  it('shows the default decoder rejects the same 50-attachment packet', async () => {
    await expect(decodeBinaryPacket(new Decoder(), 50)).rejects.toThrow('too many attachments')
  })
})
