import { decodeWireBytes } from './byte-encoding'

describe('untrusted JSON byte encodings', () => {
  it('preserves bytes through Buffer and Uint8Array JSON and ignores insertion order of numeric indices', () => {
    const bytes = Uint8Array.from([0, 1, 127, 255])
    for (const value of [
      bytes,
      Buffer.from(bytes),
      [...bytes],
      Buffer.from(bytes).toString('base64'),
      JSON.parse(JSON.stringify(bytes)),
      JSON.parse(JSON.stringify(Buffer.from(bytes))),
      Object.fromEntries(Object.entries(bytes).reverse()),
    ]) {
      expect([...decodeWireBytes(value, 4)]).toEqual([...bytes])
    }
  })

  it.each([
    ['missing index', { 0: 1, 2: 3 }],
    ['extra key', { 0: 1, extra: 2 }],
    ['negative', { 0: -1 }],
    ['too large', { 0: 256 }],
    ['fractional', { 0: 1.1 }],
    ['string byte', { 0: '1' }],
    ['maximum plus one', { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4 }],
    ['noncanonical index', { '00': 1 }],
    ['negative index', { '-1': 1 }],
    ['sparse array', Object.assign(new Array(2), { 0: 1 })],
    ['buffer with extra field', { type: 'Buffer', data: [1], extra: true }],
    ['invalid base64', 'AQ==ignored'],
    ['empty', {}],
  ])('rejects %s without silently coercing or dropping data', (_name, value) => {
    expect(() => decodeWireBytes(value, 4)).toThrow()
  })
})
