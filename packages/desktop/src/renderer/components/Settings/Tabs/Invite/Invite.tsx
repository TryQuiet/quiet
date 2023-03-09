import React, { FC, useState } from 'react'
import { useSelector } from 'react-redux'

import { communities } from '@quiet/state-manager'

import { InviteComponent } from './InviteComponent'

export const Invite: FC = () => {
  const community = useSelector(communities.selectors.currentCommunity)

  const invitationUrl = useSelector(communities.selectors.registrarUrl(community?.id))

  const [revealInputValue, setRevealInputValue] = useState<boolean>(false)

  const handleClickInputReveal = () => {
    revealInputValue ? setRevealInputValue(false) : setRevealInputValue(true)
  }

  return <InviteComponent
    communityName={community?.name || 'community'}
    invitationUrl={invitationUrl}
    revealInputValue={revealInputValue}
    handleClickInputReveal={handleClickInputReveal}
  />
}
