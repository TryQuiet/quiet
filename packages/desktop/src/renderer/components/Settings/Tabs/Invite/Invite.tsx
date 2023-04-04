import React, { FC, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { communities } from '@quiet/state-manager'
import { shell } from 'electron'
import { InviteComponent } from './Invite.component'
import { invitationShareUrl } from '@quiet/common'

export const Invite: FC = () => {
  const community = useSelector(communities.selectors.currentCommunity)
  const invitationLink = invitationShareUrl(community?.registrarUrl)

  const openUrl = useCallback((url: string) => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    shell.openExternal(url)
  }, [])

  return <InviteComponent invitationLink={invitationLink} openUrl={openUrl} />
}
