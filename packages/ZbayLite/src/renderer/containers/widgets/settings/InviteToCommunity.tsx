import { communities } from '@zbayapp/nectar'
import React, { FC } from 'react'
import { useSelector } from 'react-redux'
import { InviteToCommunity } from '../../../components/widgets/settings/InviteToCommunity'

const InviteToCommunityTab: FC = () => {
  const community = useSelector(communities.selectors.currentCommunity)
  const invitationUrl = useSelector(communities.selectors.registrarUrl(community.id))

  return <InviteToCommunity communityName={community.name} invitationUrl={invitationUrl} />
}

export default InviteToCommunityTab
