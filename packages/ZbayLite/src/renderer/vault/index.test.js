/* eslint import/first: 0 */
jest.mock('./vault')
jest.mock('../zcash')
jest.mock('./marshalling', () => ({
  passwordToSecureStrings: jest.fn(() => [jest.mock(), jest.mock()]),
  createArchive: jest.requireActual('./marshalling').createArchive
}))
jest.mock('electron')

import { DateTime } from 'luxon'
import * as R from 'ramda'

import { createArchive } from './marshalling'
import { mock } from './vault'
import {
  create,
  remove,
  createIdentity,
  getVault,
  listIdentities,
  updateIdentity,
  withVaultInitialized
} from './'
import testUtils from '../testUtils'

describe('vault instance', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await remove()
    await create({ masterPassword: 'test password' })
    mock.workspace.archive = createArchive()
    mock.workspace.save = jest.fn()
  })

  it('creates identity', async () => {
    const [group] = mock.workspace.archive.findGroupsByTitle('Identities')
    const { id } = await createIdentity(testUtils.createIdentity())

    const [identity] = group.getEntries()
    expect(id).toEqual(identity.id)
    expect(identity.properties).toMatchSnapshot()
    expect(mock.workspace.save).toHaveBeenCalled()
  })

  it('returns created vault', () => {
    expect(getVault()).toMatchSnapshot()
  })

  const identities = [
    {
      name: 'Saturn',
      address: 'saturn-address-zcash',
      transparentAddress: 'saturn-t-address',
      keys: {
        sk: 'saturn-spending-key',
        tpk: 'saturn-transparent-private-key'
      }
    },
    {
      name: 'Mars',
      address: 'mars-address-zcash',
      transparentAddress: 'mars-t-address',
      keys: {
        sk: 'mars-spending-key',
        tpk: 'mars-transparent-private-key'
      }
    },
    {
      name: 'Jupiter',
      address: 'jupiter-address-zcash',
      transparentAddress: 'jupiter-t-address',
      keys: {
        sk: 'jupiter-spending-key',
        tpk: 'jupiter-transparent-private-key'
      }
    }
  ]

  it('lists identities', async () => {
    const [group] = mock.workspace.archive.findGroupsByTitle('Identities')
    identities.map(
      id => group.createEntry(id.name)
        .setProperty('name', id.name)
        .setProperty('address', id.address)
        .setProperty('transparentAddress', id.transparentAddress)
        .setProperty('keys', JSON.stringify(id.keys))
    )

    const result = await listIdentities()
    expect(result.map(R.omit(['id']))).toMatchSnapshot()
  })

  describe('- updateIdentity', () => {
    it('updates existing identity', async () => {
      const [group] = mock.workspace.archive.findGroupsByTitle('Identities')
      identities.map(
        id => group.createEntry(id.name)
          .setProperty('name', id.name)
          .setProperty('address', id.address)
          .setProperty('transparentAddress', id.transparentAddress)
          .setProperty('keys', JSON.stringify(id.keys))
      )
      const ids = await listIdentities()
      const updatedIdentity = {
        ...ids[0],
        address: 'sapling-new-updated-address'
      }

      await updateIdentity(updatedIdentity)

      const result = await listIdentities()
      expect(result.map(R.omit(['id']))).toMatchSnapshot()
    })
  })

  describe('list channels', () => {
    it('when contains channels', async () => {
      const identityId = 'this-is-a-test-id'
      jest.spyOn(DateTime, 'utc').mockImplementation(() => testUtils.now)
      await Promise.all(
        R.range(1, 4)
          .map(testUtils.channels.createChannel)
          .map(
            R.curry(getVault().channels.importChannel)(identityId)
          )
      )
      const channels = await getVault().channels.listChannels(identityId)
      expect(channels.map(R.omit(['id']))).toMatchSnapshot()
    })

    it('when does not contain channels', async () => {
      const identityId = 'this-is-a-test-id'
      const channels = await getVault().channels.listChannels(identityId)
      expect(channels).toEqual([])
    })
  })

  it('withVaultInitialized fails function when no vault', async () => {
    await remove()
    const foo = jest.fn()
    const wrapped = withVaultInitialized(foo)
    expect(wrapped).toThrow('Archive not initialized.')
  })

  it('withVaultInitialized pass calls to wrapped function', async () => {
    const arg1 = jest.mock()
    const arg2 = jest.mock()
    const foo = jest.fn()
    const wrapped = withVaultInitialized(foo)

    await wrapped(arg1, arg2)

    expect(foo).toHaveBeenCalledWith(arg1, arg2)
  })
})
