import { communities } from '@quiet/state-manager'
import React, { FC, useState } from 'react'
import { useSelector } from 'react-redux'
import { InviteToCommunity } from '../../../components/widgets/settings/InviteToCommunity'

const InviteToCommunityTab: FC = () => {
  const community = useSelector(communities.selectors.currentCommunity)

  const invitationUrl = useSelector(communities.selectors.registrarUrl(community?.id))

  const [revealInputValue, setRevealInputValue] = useState<boolean>(false)

  const handleClickInputReveal = () => {
    revealInputValue ? setRevealInputValue(false) : setRevealInputValue(true)
  }

  return <InviteToCommunity
    communityName={community?.name || 'community'}
    invitationUrl={invitationUrl}
    revealInputValue={revealInputValue}
    handleClickInputReveal={handleClickInputReveal}
  />
}

export default InviteToCommunityTab
