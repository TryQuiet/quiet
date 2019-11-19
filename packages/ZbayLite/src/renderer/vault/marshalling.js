import { Archive, Workspace, Credentials, Datasources } from '../vendor/buttercup'
import { validateArchiveGroups } from './validateArchive'

export const archiveGroups = ['Identities', 'Channels', 'Contacts', 'Offers', 'TxnTs', 'Adverts', 'RemovedChannels']

export const createArchive = () => {
  const archive = new Archive()
  archiveGroups.forEach(group => {
    archive.createGroup(group)
  })

  return archive
}

export const credentialsToDatasource = ({ sourceCredentials }) => {
  const datasourceDescriptionRaw = sourceCredentials.getValueOrFail('datasource')
  const datasourceDescription =
    typeof datasourceDescriptionRaw === 'string'
      ? JSON.parse(datasourceDescriptionRaw)
      : datasourceDescriptionRaw

  if (typeof datasourceDescription.type !== 'string') {
    throw new Error('Invalid or missing type')
  }
  return Datasources.objectToDatasource(datasourceDescription, sourceCredentials)
}

export const credentialsToWorkspace = async ({
  sourceCredentials,
  archiveCredentials,
  createSource = false
}) => {
  const datasource = credentialsToDatasource({ sourceCredentials })
  let archive = null
  if (createSource) {
    const defaultArchive = createArchive()
    await datasource.save(defaultArchive.getHistory(), archiveCredentials)
    archive = defaultArchive
  } else {
    const history = await datasource.load(archiveCredentials)
    archive = Archive.createFromHistory(history)
    validateArchiveGroups(archive)
  }
  const workspace = new Workspace()
  workspace.setArchive(archive, datasource, archiveCredentials)
  return workspace
}

export const passwordToSecureStrings = async ({ masterPassword, datasourceObj }) => {
  const passwordCredentials = Credentials.fromPassword(masterPassword)
  const sourceCredentials = new Credentials({
    ...passwordCredentials,
    type: datasourceObj.type
  })
  sourceCredentials.setValue(
    'datasource',
    JSON.stringify({ type: datasourceObj.type, path: datasourceObj.path })
  )
  return Promise.all([
    sourceCredentials.toSecureString(masterPassword),
    passwordCredentials.toSecureString(masterPassword)
  ])
}

export const credentialsFromSecureStrings = async ({
  sourceCredentials,
  archiveCredentials,
  masterPassword
}) =>
  Promise.all([
    Credentials.fromSecureString(sourceCredentials, masterPassword),
    Credentials.fromSecureString(archiveCredentials, masterPassword)
  ])

export const credentialsToSecureStrings = async ({ sourceCredentials, archiveCredentials }) =>
  Promise.all([
    sourceCredentials.toSecureString(archiveCredentials.password),
    archiveCredentials.toSecureString(archiveCredentials.password)
  ])

export default {
  credentialsToWorkspace,
  passwordToSecureStrings,
  credentialsFromSecureStrings,
  credentialsToSecureStrings
}
