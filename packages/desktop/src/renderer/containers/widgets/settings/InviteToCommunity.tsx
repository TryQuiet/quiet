import { communities } from '@quiet/state-manager'
import React, { FC, useState } from 'react'
import { useSelector } from 'react-redux'
import { InviteToCommunity } from '../../../components/widgets/settings/InviteToCommunity'

const InviteToCommunityTab: FC = () => {
  const community = useSelector(communities.selectors.currentCommunity)
  const invitationUrl = useSelector(communities.selectors.registrarUrl(community?.id))

  const [showPassword, setShowPassword] = useState<boolean>(false)

  const handleClickShowPassword = () => {
    showPassword ? setShowPassword(false) : setShowPassword(true)
  }

  return <InviteToCommunity
    communityName={community?.name}
    invitationUrl={invitationUrl}
    showPassword={showPassword}
    handleClickShowPassword={handleClickShowPassword}
  />
}

export default InviteToCommunityTab
