import React, { FC, useState } from 'react'
import { useSelector } from 'react-redux'
import { communities } from '@quiet/state-manager'
import { InviteComponent } from './Invite.component'
import { invitationShareUrl } from '@quiet/common'

export const Invite: FC = () => {
  const community = useSelector(communities.selectors.currentCommunity)
  const invitationLink = invitationShareUrl(community?.registrarUrl)

  const [revealInputValue, setRevealInputValue] = useState<boolean>(false)

  const handleClickInputReveal = () => {
    revealInputValue ? setRevealInputValue(false) : setRevealInputValue(true)
  }

  return (
    <InviteComponent
      invitationLink={invitationLink}
      revealInputValue={revealInputValue}
      handleClickInputReveal={handleClickInputReveal}
    />
  )
}
