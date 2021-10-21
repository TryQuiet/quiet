import { communities } from '@zbayapp/nectar'
import React, { FC } from 'react'
import { useSelector } from 'react-redux'
import { InviteToCommunity } from '../../../components/widgets/settings/InviteToCommunity'

const InviteToCommunityTab: FC = () => {
  const communityName = useSelector(communities.selectors.currentCommunity).name
  const invitationUrl = useSelector(communities.selectors.registrarUrl)
  return (
    <InviteToCommunity
      communityName={communityName}
      invitationUrl={invitationUrl}
    />
  )
}

export default InviteToCommunityTab
