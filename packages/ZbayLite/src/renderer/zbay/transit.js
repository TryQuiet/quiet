import bech32 from 'bech32'

import { inflate, deflate } from '../compression'

export const MEMO_SIZE = 512
const ADDRESS_SIZE = 43
const USERNAME_SIZE = 20
const TIMESTAMP_SIZE = 4
const TYPE_SIZE = 1
const MESSAGE_SIZE = MEMO_SIZE - (
  ADDRESS_SIZE +
  USERNAME_SIZE +
  TIMESTAMP_SIZE +
  TYPE_SIZE
)

const decodeAddress = (address) => {
  const { words } = bech32.decode(address)
  return Buffer.from(bech32.fromWords(words))
}

const encodeAddress = (address, prefix) => bech32.encode(
  prefix,
  bech32.toWords(Buffer.from(address))
)

export const packMemo = async (message) => {
  const replyTo = decodeAddress(message.sender.replyTo)

  const username = Buffer.alloc(USERNAME_SIZE)
  username.write(message.sender.username || '')

  const ts = Buffer.alloc(TIMESTAMP_SIZE)
  ts.writeUInt32BE(message.createdAt)

  const type = Buffer.alloc(1)
  type.writeUInt8(message.type)

  const msgData = Buffer.alloc(MESSAGE_SIZE)
  msgData.write(await deflate(message.message))

  const result = Buffer.concat([
    replyTo,
    username,
    ts,
    type,
    msgData
  ])
  return result.toString('hex')
}

const terminatedStringLength = (stringB) => {
  const terminatorIndex = stringB.indexOf(0)
  if (terminatorIndex === -1) {
    return Buffer.byteLength(stringB)
  }
  return terminatorIndex
}

export const unpackMemo = async (memo, testnet) => {
  const prefix = testnet ? 'ztestsapling' : 'zs'
  const memoBuff = Buffer.from(memo, 'hex')

  const replyTo = encodeAddress(memoBuff.slice(0, ADDRESS_SIZE), prefix)

  const usernameEnds = ADDRESS_SIZE + USERNAME_SIZE
  const usernameBuff = memoBuff.slice(ADDRESS_SIZE, usernameEnds)
  const username = usernameBuff.toString(
    'utf8',
    0,
    terminatedStringLength(usernameBuff)
  )

  const timestampEnds = usernameEnds + TIMESTAMP_SIZE
  const createdAt = memoBuff.slice(usernameEnds, timestampEnds).readUInt32BE()

  const typeEnds = timestampEnds + TYPE_SIZE
  const type = memoBuff.slice(timestampEnds, typeEnds).readUInt8()

  const message = memoBuff.slice(typeEnds)

  return {
    sender: {
      replyTo,
      ...(username && { username })
    },
    message: await inflate(message.toString()),
    createdAt,
    type
  }
}
