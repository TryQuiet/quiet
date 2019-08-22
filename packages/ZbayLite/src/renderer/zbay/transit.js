import { inflate, deflate } from '../compression'

export const MEMO_SIZE = 512
const TYPE_SIZE = 1
const SIGNATURE_SIZE = 64
const TIMESTAMP_SIZE = 4
const MESSAGE_SIZE = MEMO_SIZE - (TIMESTAMP_SIZE + SIGNATURE_SIZE + TYPE_SIZE)

export const packMemo = async message => {
  const type = Buffer.alloc(TYPE_SIZE)
  type.writeUInt8(message.type)
  const signatureData = message.signature
  const ts = Buffer.alloc(TIMESTAMP_SIZE)
  ts.writeUInt32BE(message.createdAt)

  const msgData = Buffer.alloc(MESSAGE_SIZE)
  const d = await deflate(message.message)
  msgData.write(d)

  const result = Buffer.concat([type, signatureData, ts, msgData])
  return result.toString('hex')
}

export const unpackMemo = async (memo) => {
  const memoBuff = Buffer.from(memo, 'hex')

  const typeEnds = TYPE_SIZE
  const type = memoBuff.slice(0, typeEnds).readUInt8()

  const signatureEnds = typeEnds + SIGNATURE_SIZE
  const signature = memoBuff.slice(typeEnds, signatureEnds)
  const timestampEnds = signatureEnds + TIMESTAMP_SIZE
  const createdAt = memoBuff.slice(signatureEnds, timestampEnds).readUInt32BE()
  const message = memoBuff.slice(timestampEnds)

  return {
    type,
    signature,
    message: await inflate(message.toString()),
    createdAt
  }
}
