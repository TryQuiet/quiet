import secp256k1 from 'secp256k1'

import { packMemo, unpackMemo, MEMO_SIZE } from './transit'
import { now } from '../testUtils'
import { messageType, hash } from './messages'

const sigObj = secp256k1.sign(
  hash(JSON.stringify('test DATA')),
  Buffer.alloc(32, 'test private key')
)

describe('transit', () => {
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
})
