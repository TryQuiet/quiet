import { inflate, deflate } from '../compression'
import { messageType } from './messages'
export const MEMO_SIZE = 512
const TYPE_SIZE = 1
const SIGNATURE_SIZE = 64
const TIMESTAMP_SIZE = 4
const MESSAGE_SIZE = MEMO_SIZE - (TIMESTAMP_SIZE + SIGNATURE_SIZE + TYPE_SIZE)

const ADDRESS_TYPE = {
  SHIELDED_MAINNET: 1,
  SHIELDED_TESTNET: 2
}
const FIRST_NAME_SIZE = 20
const LAST_NAME_SIZE = 20
const NICKNAME_SIZE = 20
const ADDRESS_TYPE_SIZE = 1
const SHIELDED_MAINNET_SIZE = 78
const SHIELDED_TESTNET_SIZE = 88

const addressSizeToType = {
  [SHIELDED_MAINNET_SIZE]: ADDRESS_TYPE.SHIELDED_MAINNET,
  [SHIELDED_TESTNET_SIZE]: ADDRESS_TYPE.SHIELDED_TESTNET
}
const typeToAddressSize = {
  [ADDRESS_TYPE.SHIELDED_MAINNET]: SHIELDED_MAINNET_SIZE,
  [ADDRESS_TYPE.SHIELDED_TESTNET]: SHIELDED_TESTNET_SIZE
}

export const packMemo = async message => {
  const type = Buffer.alloc(TYPE_SIZE)
  type.writeUInt8(message.type)
  const signatureData = message.signature
  const ts = Buffer.alloc(TIMESTAMP_SIZE)
  ts.writeUInt32BE(message.createdAt)

  let msgData

  if (message.type === messageType.USER) {
    const firstName = Buffer.alloc(FIRST_NAME_SIZE)
    firstName.write(message.message.firstName)

    const lastName = Buffer.alloc(LAST_NAME_SIZE)
    lastName.write(message.message.lastName)

    const nickname = Buffer.alloc(NICKNAME_SIZE)
    nickname.write(message.message.nickname)

    const addressType = Buffer.alloc(ADDRESS_TYPE_SIZE)
    const type = addressSizeToType[message.message.address.length]
    addressType.writeUInt8(type)

    const address = Buffer.alloc(typeToAddressSize[type])
    address.write(message.message.address)
    msgData = Buffer.concat([firstName, lastName, nickname, addressType, address], MESSAGE_SIZE)
  } else {
    msgData = Buffer.alloc(MESSAGE_SIZE)
    const d = await deflate(message.message)
    msgData.write(d)
  }
  const result = Buffer.concat([type, signatureData, ts, msgData])
  return result.toString('hex')
}

export const unpackMemo = async memo => {
  const memoBuff = Buffer.from(memo, 'hex')

  const typeEnds = TYPE_SIZE
  const type = memoBuff.slice(0, typeEnds).readUInt8()

  const signatureEnds = typeEnds + SIGNATURE_SIZE
  const signature = memoBuff.slice(typeEnds, signatureEnds)
  const timestampEnds = signatureEnds + TIMESTAMP_SIZE
  const createdAt = memoBuff.slice(signatureEnds, timestampEnds).readUInt32BE()
  if (type === messageType.USER) {
    const firstNameEnds = timestampEnds + FIRST_NAME_SIZE
    const firstName = memoBuff.slice(timestampEnds, firstNameEnds)

    const lastNameEnds = firstNameEnds + LAST_NAME_SIZE
    const lastName = memoBuff.slice(firstNameEnds, lastNameEnds)

    const nicknameEnds = lastNameEnds + NICKNAME_SIZE
    const nickname = memoBuff.slice(lastNameEnds, nicknameEnds)

    const addressTypeEnds = nicknameEnds + ADDRESS_TYPE_SIZE
    const addressType = memoBuff.slice(nicknameEnds, addressTypeEnds).readUInt8()

    const addressEnds = addressTypeEnds + typeToAddressSize[addressType]
    const address = memoBuff.slice(addressTypeEnds, addressEnds)
    return {
      type,
      signature,
      message: {
        firstName: trimNull(firstName.toString()),
        lastName: trimNull(lastName.toString()),
        nickname: trimNull(nickname.toString()),
        address: address.toString()
      },
      createdAt
    }
  } else {
    const message = memoBuff.slice(timestampEnds)
    return {
      type,
      signature,
      message: await inflate(message.toString()),
      createdAt
    }
  }
}

const trimNull = a => {
  var c = a.indexOf('\0')
  if (c > -1) {
    return a.substr(0, c)
  }
  return a
}
