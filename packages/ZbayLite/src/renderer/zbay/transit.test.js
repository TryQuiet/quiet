import secp256k1 from 'secp256k1'

import { packMemo, unpackMemo, MEMO_SIZE } from './transit'
import { now } from '../testUtils'
import { messageType, hash } from './messages'
import { moderationActionsType } from '../store/handlers/moderationActions'

const sigObj = secp256k1.sign(
  hash(JSON.stringify('test DATA')),
  Buffer.alloc(32, 'test private key')
)
const message = {
  type: messageType.BASIC,
  signature: sigObj.signature,
  r: sigObj.recovery,
  createdAt: now.toSeconds(),
  message: 'This is a simple message'
}

const messageUserTestnet = {
  type: messageType.USER,
  signature: sigObj.signature,
  r: sigObj.recovery,
  createdAt: now.toSeconds(),
  message: {
    firstName: 'testname',
    lastName: 'testlastname',
    nickname: 'nickname',
    address:
      'ztestsapling14dxhlp8ps4qmrslt7pcayv8yuyx78xpkrtfhdhae52rmucgqws2zp0zwf2zu6qxjp96lzapsn4r'
  }
}
const messageUserMainnet = {
  type: messageType.USER,
  signature: sigObj.signature,
  r: sigObj.recovery,
  createdAt: now.toSeconds(),
  message: {
    firstName: 'testname',
    lastName: 'testlastname',
    nickname: 'nickname',
    address: 'zs1ecsq8thnu84ejvfx2jcfsa6zas2k057n3hrhuy0pahmlvqfwterjaz3h772ldlsgp5r2xwvml9g'
  }
}
const advert = {
  type: messageType.AD,
  signature: sigObj.signature,
  r: sigObj.recovery,
  createdAt: now.toSeconds(),
  message: {
    tag: 'tag',
    background: '244',
    title: 'title',
    provideShipping: '1',
    amount: '122.234',
    description: 'hello heloo description wowo'
  }
}
const itemBasic = {
  type: messageType.ITEM_BASIC,
  signature: sigObj.signature,
  r: sigObj.recovery,
  createdAt: now.toSeconds(),
  message: {
    itemId: '6b31f1a5c68902a767eb542fa17daeb338e32d12704ac124ce55994754a5001e',
    text: 'hello heloo description wowo'
  }
}
const itemTransfer = {
  type: messageType.ITEM_TRANSFER,
  signature: sigObj.signature,
  r: sigObj.recovery,
  createdAt: now.toSeconds(),
  message: {
    itemId: '6b31f1a5c68902a767eb542fa17daeb338e32d12704ac124ce55994754a5001e',
    text: 'hello heloo description wowo'
  }
}
const channelSettings = {
  type: messageType.CHANNEL_SETTINGS,
  signature: sigObj.signature,
  r: sigObj.recovery,
  createdAt: now.toSeconds(),
  message: {
    owner: '6b31f1a5c68902a767eb542fa17daeb338e32d12704ac124ce55994754a5001e',
    minFee: '4294967295',
    onlyRegistered: '1'
  }
}
const moderationMessage = (moderationType, moderationTarget) => ({
  type: messageType.MODERATION,
  signature: sigObj.signature,
  r: sigObj.recovery,
  createdAt: now.toSeconds(),
  message: {
    moderationTarget: moderationTarget,
    moderationType: moderationType
  }
})
describe('transit', () => {
  describe('pack/unpack memo', () => {
    it('is symmetrical', async () => {
      const data = await packMemo(message)
      expect(Buffer.byteLength(data, 'hex')).toEqual(MEMO_SIZE)
      const output = await unpackMemo(data)
      expect(output).toEqual(message)
    })
  })
  describe('pack/unpack User memo', () => {
    it('is symmetrical testnet', async () => {
      const data = await packMemo(messageUserTestnet)
      expect(Buffer.byteLength(data, 'hex')).toEqual(MEMO_SIZE)
      const output = await unpackMemo(data)
      expect(output).toEqual(messageUserTestnet)
    })

    it('is symmetrical mainnet', async () => {
      const data = await packMemo(messageUserMainnet)
      expect(Buffer.byteLength(data, 'hex')).toEqual(MEMO_SIZE)
      const output = await unpackMemo(data)
      expect(output).toEqual(messageUserMainnet)
    })
  })
  describe('pack/unpack Advert memo', () => {
    it('is symmetrical', async () => {
      const data = await packMemo(advert)
      expect(Buffer.byteLength(data, 'hex')).toEqual(MEMO_SIZE)
      const output = await unpackMemo(data)
      expect(output).toEqual(advert)
    })
  })
  describe('pack/unpack Item Basic memo', () => {
    it('is symmetrical', async () => {
      const data = await packMemo(itemBasic)
      expect(Buffer.byteLength(data, 'hex')).toEqual(MEMO_SIZE)
      const output = await unpackMemo(data)
      expect(output).toEqual(itemBasic)
    })
  })
  describe('pack/unpack Item Transfer memo', () => {
    it('is symmetrical', async () => {
      const data = await packMemo(itemTransfer)
      expect(Buffer.byteLength(data, 'hex')).toEqual(MEMO_SIZE)
      const output = await unpackMemo(data)
      expect(output).toEqual(itemTransfer)
    })
  })
  describe('pack/unpack Channel Settings memo', () => {
    it('is symmetrical', async () => {
      const data = await packMemo(channelSettings)
      expect(Buffer.byteLength(data, 'hex')).toEqual(MEMO_SIZE)
      const output = await unpackMemo(data)
      expect(output).toEqual(channelSettings)
    })
  })
  describe('pack/unpack Moderation memo', () => {
    it('is symmetrical remove channel', async () => {
      const removeChannelMessage = moderationMessage(
        moderationActionsType.REMOVE_CHANNEL,
        '6b31f1a5c68902a767eb542fa17daeb338e32d12704ac124ce55994754a5001e'
      )
      const data = await packMemo(removeChannelMessage)
      expect(Buffer.byteLength(data, 'hex')).toEqual(MEMO_SIZE)
      const output = await unpackMemo(data)
      expect(output).toEqual(removeChannelMessage)
    })
    it('is symmetrical remove message', async () => {
      const removeMessageMessage = moderationMessage(
        moderationActionsType.REMOVE_MESSAGE,
        '6b31f1a5c68902a767eb542fa17daeb338e32d12704ac124ce55994754a5001e'
      )
      const data = await packMemo(removeMessageMessage)
      expect(Buffer.byteLength(data, 'hex')).toEqual(MEMO_SIZE)
      const output = await unpackMemo(data)
      expect(output).toEqual(removeMessageMessage)
    })
    it('is symmetrical add mod', async () => {
      const addModMessage = moderationMessage(
        moderationActionsType.ADD_MOD,
        '0208be86d3cac41fdb539b0b761bedccedaa300d5a09fd3ca34b6acad1ba856bcb'
      )
      const data = await packMemo(addModMessage)
      expect(Buffer.byteLength(data, 'hex')).toEqual(MEMO_SIZE)
      const output = await unpackMemo(data)
      expect(output).toEqual(addModMessage)
    })
    it('is symmetrical remove mod', async () => {
      const removeModMessage = moderationMessage(
        moderationActionsType.REMOVE_MOD,
        '0208be86d3cac41fdb539b0b761bedccedaa300d5a09fd3ca34b6acad1ba856bcb'
      )
      const data = await packMemo(removeModMessage)
      expect(Buffer.byteLength(data, 'hex')).toEqual(MEMO_SIZE)
      const output = await unpackMemo(data)
      expect(output).toEqual(removeModMessage)
    })
    it('is symmetrical block user', async () => {
      const blockUserMessage = moderationMessage(
        moderationActionsType.BLOCK_USER,
        '0208be86d3cac41fdb539b0b761bedccedaa300d5a09fd3ca34b6acad1ba856bcb'
      )
      const data = await packMemo(blockUserMessage)
      expect(Buffer.byteLength(data, 'hex')).toEqual(MEMO_SIZE)
      const output = await unpackMemo(data)
      expect(output).toEqual(blockUserMessage)
    })
    it('is symmetrical unblock user', async () => {
      const unblockUserMessage = moderationMessage(
        moderationActionsType.UNBLOCK_USER,
        '0208be86d3cac41fdb539b0b761bedccedaa300d5a09fd3ca34b6acad1ba856bcb'
      )
      const data = await packMemo(unblockUserMessage)
      expect(Buffer.byteLength(data, 'hex')).toEqual(MEMO_SIZE)
      const output = await unpackMemo(data)
      expect(output).toEqual(unblockUserMessage)
    })
  })
})
