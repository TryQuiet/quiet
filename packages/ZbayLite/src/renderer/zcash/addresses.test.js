import addressesFactory from './addresses'

describe('addresses', () => {
  const typeToAddress = {
    sapling: 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9sly',
    sprout: 'zcU1Cd6zYyZCd2VJF8yKgmzjxdiiU1rgTTjEwoN1CGUWCziPkUTXUjXmX7TMqdMNsTfuiGN1jQoVN4kGxUR4sAPN4XZ7pxb'
  }

  const zcashClient = {
    request: {
      'z_getnewaddress': jest.fn(async (type) => typeToAddress[type]),
      'getnewaddress': jest.fn(async () => 't14oHp2v54vfmdgQ3v3SNuQga8JKHTNi2a1')
    }
  }

  const addresses = addressesFactory(zcashClient)

  describe('create', () => {
    it('creates a sapling address by default', async () => {
      expect(addresses.create()).resolves.toMatchSnapshot()
    })

    it('creates a sapling address', async () => {
      expect(addresses.create('sapling')).resolves.toMatchSnapshot()
    })

    it('creates a sprout address', async () => {
      expect(addresses.create('sprout')).resolves.toMatchSnapshot()
    })
  })

  it('createTransparent creates a transparent address', () => {
    expect(addresses.createTransparent()).resolves.toMatchSnapshot()
  })
})
