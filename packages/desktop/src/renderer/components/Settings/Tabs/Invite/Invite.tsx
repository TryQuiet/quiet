import React, { FC, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { communities } from '@quiet/state-manager'
import { InviteComponent } from './Invite.component'
import { shell } from 'electron'

export const Invite: FC = () => {
  const community = useSelector(communities.selectors.currentCommunity)
  const invitationLink =
    `https://tryquiet.org/join?code=${community?.registrarUrl}` || 'https://tryquiet.org/'

  const openUrl = useCallback((url: string) => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    shell.openExternal(url)
  }, [])

  return <InviteComponent invitationLink={invitationLink} openUrl={openUrl} />
}
