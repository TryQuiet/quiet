/* eslint import/first: 0 */
jest.mock('../../renderer/zcash')
jest.mock('../../renderer/vault/vault')
jest.mock('../../renderer/vault/marshalling', () => ({
  passwordToSecureStrings: jest.fn(() => [jest.mock(), jest.mock()]),
  createArchive: jest.requireActual('../../renderer/vault/marshalling').createArchive
}))

import { create, remove, getVault, listIdentities } from '../../renderer/vault'
import { mock } from '../../renderer/vault/vault'
import { createArchive } from '../../renderer/vault/marshalling'
import { mock as zcashMock } from '../../renderer/zcash'
import * as R from 'ramda'

import migrations from './0_2_0'

describe('0.2.0 migrations', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
  })

  describe('- ensureIdentityHasKeys', () => {
    const sk = 'sapling-private-address-spending-key'
    const tpk = 'transparent-address-private-key'
    const identity = {
      name: 'Saturn',
      address: 'sapling-private-address',
      transparentAddress: 'transparent-address'
    }

    const identityWithKeys = {
      ...identity,
      keys: {
        sk, tpk
      }
    }

    beforeEach(async () => {
      await remove()
      await create({ masterPassword: 'test password' })
      mock.workspace.archive = createArchive()
      mock.workspace.save = jest.fn()
    })

    it('does not run if identity has keys', async () => {
      await migrations.ensureIdentityHasKeys(identityWithKeys)

      expect(mock.workspace.save).not.toHaveBeenCalled()
      expect(zcashMock.requestManager.z_exportkey).not.toHaveBeenCalled()
      expect(zcashMock.requestManager.dumpprivkey).not.toHaveBeenCalled()
    })

    it('updates identity in the vault with keys', async () => {
      let entry
      await getVault().withWorkspace(workspace => {
        const [identitiesGroup] = workspace.archive.findGroupsByTitle('Identities')
        entry = identitiesGroup.createEntry(identity.name)
          .setProperty('name', identity.name)
          .setProperty('address', identity.address)
          .setProperty('transparentAddress', identity.transparentAddress)
      })
      const identityFromVault = {
        ...identity, id: entry.id
      }

      await migrations.ensureIdentityHasKeys(identityFromVault)

      expect(zcashMock.requestManager.z_exportkey).toHaveBeenCalledWith(identity.address)
      expect(zcashMock.requestManager.dumpprivkey).toHaveBeenCalledWith(identity.transparentAddress)
      expect(mock.workspace.save).toHaveBeenCalled()
      const identities = await listIdentities()
      expect(identities.map(R.omit(['id']))).toMatchSnapshot()
    })

    it('throws if not migrated on a new node', async () => {
      let entry
      await getVault().withWorkspace(workspace => {
        const [identitiesGroup] = workspace.archive.findGroupsByTitle('Identities')
        entry = identitiesGroup.createEntry(identity.name)
          .setProperty('name', identity.name)
          .setProperty('address', identity.address)
          .setProperty('transparentAddress', identity.transparentAddress)
      })
      const identityFromVault = {
        ...identity, id: entry.id
      }
      zcashMock.requestManager.z_exportkey.mockRejectedValueOnce(
        new Error('this address doesn\t belong to the wallet')
      )
      zcashMock.requestManager.dumpprivkey.mockRejectedValueOnce(
        new Error('this address doesn\t belong to the wallet')
      )

      expect.assertions(2)

      try {
        await migrations.ensureIdentityHasKeys(identityFromVault)
      } catch (err) {
        expect(err).toMatchSnapshot()
      }

      expect(mock.workspace.save).not.toHaveBeenCalled()
    })
  })
})
