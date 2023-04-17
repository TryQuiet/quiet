import React, { FC, useState } from 'react'
import { useSelector } from 'react-redux'
import { communities } from '@quiet/state-manager'
import { InviteComponent } from './Invite.component'

export const Invite: FC = () => {
  const invitationLink = useSelector(communities.selectors.invitationUrl)

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
