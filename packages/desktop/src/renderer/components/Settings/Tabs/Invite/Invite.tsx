import React, { FC, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { connection, communities } from '@quiet/state-manager'
import { InviteComponent } from './Invite.component'

export const Invite: FC = () => {
  const dispatch = useDispatch()
  const invitationLink = useSelector(connection.selectors.invitationUrl)

  const [revealInputValue, setRevealInputValue] = useState<boolean>(false)

  const handleInviteShare = () => {
    // TODO: update invitationLink with the cid from the upload if user is using QSS
    console.log('handleInviteShare: dispatching communities.actions.uploadCommunityData')
    dispatch(communities.actions.uploadCommunityData())
  }

  const handleClickInputReveal = () => {
    revealInputValue ? setRevealInputValue(false) : setRevealInputValue(true)
    handleInviteShare()
  }

  return (
    <InviteComponent
      invitationLink={invitationLink}
      revealInputValue={revealInputValue}
      handleClickInputReveal={handleClickInputReveal}
      handleInviteShare={handleInviteShare}
    />
  )
}
