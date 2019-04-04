/* eslint import/first: 0 */
jest.mock('./vault')
jest.mock('./marshalling', () => ({
  passwordToSecureStrings: jest.fn(() => [jest.mock(), jest.mock()])
}))
jest.mock('electron')

import * as R from 'ramda'

import { Archive } from '../vendor/buttercup'
import Vault from './vault'
import { create, remove, createIdentity, listIdentities } from './'

describe('vault instance', () => {
  const workspace = jest.mock()
  beforeEach(async () => {
    jest.clearAllMocks()
    Vault.mockImplementation(
      () => ({
        withWorkspace: async (cb) => cb(workspace),
        lock: async (arg) => arg
      })
    )
    await remove()
    await create({ masterPassword: 'test password' })
  })

  it('creates identity', async () => {
    workspace.archive = new Archive()
    const group = workspace.archive.createGroup('Identities')
    workspace.save = jest.fn()
    const { id } = await createIdentity({
      name: 'Saturn',
      address: 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9sly'
    })

    const [identity] = group.getEntries()
    expect(id).toEqual(identity.id)
    expect(identity.properties).toMatchSnapshot()
    expect(workspace.save).toHaveBeenCalled()
  })

  const identities = [
    { name: 'Saturn', address: 'saturn-address-zcash' },
    { name: 'Mars', address: 'mars-address-zcash' },
    { name: 'Jupiter', address: 'jupiter-address-zcash' }
  ]

  it('lists identities', async () => {
    workspace.archive = new Archive()
    const group = workspace.archive.createGroup('Identities')
    identities.map(
      id => group.createEntry(id.name)
        .setProperty('name', id.name)
        .setProperty('address', id.address)
    )

    const result = await listIdentities()
    expect(result.map(R.omit(['id']))).toMatchSnapshot()
  })
})
