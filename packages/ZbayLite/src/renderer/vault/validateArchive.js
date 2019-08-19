import { archiveGroups } from './marshalling'

export const validateArchiveGroups = archive => {
  archiveGroups.forEach(group => {
    if (archive.findGroupsByTitle(group).length === 0) {
      archive.createGroup(group)
    }
  })
}
