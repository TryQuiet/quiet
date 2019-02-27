/* eslint import/first: 0 */
jest.mock('../vendor/buttercup')
import {
  passwordToSecureStrings,
  credentialsFromSecureStrings,
  credentialsToSecureStrings,
  credentialsToDatasource,
  credentialsToWorkspace
} from './marshalling'
import { Credentials, Datasources, Workspace } from '../vendor/buttercup'

describe('marshalling', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const datasourceObj = {
    type: 'ipc',
    path: '/test/path'
  }

  describe('passwordToSecureStrings', () => {
    const masterPassword = 'master password'

    it('returns secure strings', async () => {
      Credentials.prototype.toSecureString.mockImplementation(() => 'test-secure-string')

      const credentials = await passwordToSecureStrings({ masterPassword, datasourceObj })
      expect(credentials).toMatchSnapshot()
    })

    it('creates credentials', async () => {
      await passwordToSecureStrings({ masterPassword, datasourceObj })
      expect(Credentials.mock.calls).toMatchSnapshot()
    })
  })

  describe('credentialsFromSecureStrings', () => {
    it('uses secure strings to create credentials', async () => {
      await credentialsFromSecureStrings({
        sourceCredentials: 'secure-string-source',
        archiveCredentials: 'secure-string-archive',
        masterPassword: 'master-password'
      })
      expect(Credentials.fromSecureString.mock.calls).toMatchSnapshot()
    })

    it('returns created credentials', async () => {
      Credentials.fromSecureString.mockImplementation((...x) => x)
      const result = await credentialsFromSecureStrings({
        sourceCredentials: 'secure-string-source',
        archiveCredentials: 'secure-string-archive',
        masterPassword: 'master-password'
      })
      expect(result).toMatchSnapshot()
    })
  })

  it('credentialsToSecureStrings creates secure strings', async () => {
    const sourceCredentials = new Credentials()
    sourceCredentials.toSecureString.mockImplementationOnce(async (pass) => `${pass}-source`)
    const archiveCredentials = new Credentials()
    archiveCredentials.toSecureString.mockImplementationOnce(async (pass) => `${pass}-archive`)
    archiveCredentials.password = 'master-password'

    const result = await credentialsToSecureStrings({
      sourceCredentials,
      archiveCredentials
    })
    expect(result).toMatchSnapshot()
  })

  describe('credentialsToDatasource', () => {
    it('creates datasource', () => {
      const sourceCredentials = new Credentials()
      sourceCredentials.getValueOrFail.mockImplementationOnce((key) => key === 'datasource' && datasourceObj)
      Datasources.objectToDatasource.mockImplementation((...args) => ({ datasource: args }))

      const datasource = credentialsToDatasource({ sourceCredentials })
      expect(datasource).toMatchSnapshot()
    })

    it('throws when no datasource type on credentials', () => {
      const sourceCredentials = new Credentials()
      sourceCredentials.getValueOrFail.mockImplementationOnce((key) => key === 'datasource' && { path: 'test' })
      expect(() => credentialsToDatasource({ sourceCredentials })).toThrowErrorMatchingSnapshot()
    })
  })

  describe('credentialsToWorkspace', async () => {
    it('creates new archive', async () => {
      const sourceCredentials = new Credentials()
      sourceCredentials.getValueOrFail.mockImplementationOnce((key) => key === 'datasource' && datasourceObj)
      const archiveCredentials = new Credentials()
      const datasourceMock = {
        save: jest.fn()
      }
      Datasources.objectToDatasource.mockReturnValue(datasourceMock)
      Workspace.prototype.setArchive.mockImplementation((...args) => expect(args).toMatchSnapshot())

      expect.assertions(2)
      await credentialsToWorkspace({ sourceCredentials, archiveCredentials, createSource: true })
      expect(datasourceMock.save).toHaveBeenCalled()
    })

    it('loads archive', async () => {
      const sourceCredentials = new Credentials()
      sourceCredentials.getValueOrFail.mockImplementationOnce((key) => key === 'datasource' && datasourceObj)
      const archiveCredentials = new Credentials()
      const datasourceMock = {
        load: jest.fn()
      }
      Datasources.objectToDatasource.mockReturnValue(datasourceMock)
      Workspace.prototype.setArchive.mockImplementation((...args) => expect(args).toMatchSnapshot())

      expect.assertions(2)
      await credentialsToWorkspace({ sourceCredentials, archiveCredentials })
      expect(datasourceMock.load).toHaveBeenCalled()
    })
  })
})
