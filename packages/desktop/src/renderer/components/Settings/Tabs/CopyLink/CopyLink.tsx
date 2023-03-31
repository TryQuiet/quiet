import React, { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { communities } from '@quiet/state-manager'
import CopyLinkComponent from './CopyLink.component'
import { shell } from 'electron'

const CopyLink: React.FC = () => {
  const community = useSelector(communities.selectors.currentCommunity)
  const invitationLink =
    `https://tryquiet.org/join?code=${community?.registrarUrl}` || 'https://tryquiet.org/'

    const openUrl = useCallback((url: string) => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      shell.openExternal(url)
    }, [])
  return <CopyLinkComponent invitationLink={invitationLink} openUrl={openUrl} />
}

export default CopyLink
