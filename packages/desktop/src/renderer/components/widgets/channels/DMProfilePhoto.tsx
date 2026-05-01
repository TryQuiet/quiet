import React from 'react'
import { useTheme } from '@mui/material/styles'

import { UserProfile } from '@quiet/types'
import ProfilePhoto from '../../ProfilePhoto/ProfilePhoto'
import _ from 'lodash'

export interface DMProfilePhotoProps {
  members: UserProfile[]
  me: UserProfile | undefined
  borderRadius?: number
  style?: React.CSSProperties
}

const STYLE: React.CSSProperties = {
  paddingBottom: 0,
  padding: 0,
  marginLeft: 0,
  marginRight: 2,
  marginBottom: 0,
  fontSize: '1rem',
  lineHeight: '1.68',
  borderRadius: 4,
}

const DMProfilePhoto: React.FC<DMProfilePhotoProps> = ({ members, me, borderRadius = 4, style = {} }) => {
  const theme = useTheme()
  const styleOverride = {
    ...STYLE,
    ...style,
  }
  if (_.size(members) === 1) {
    return (
      <ProfilePhoto
        userProfile={members[0]}
        userId={members[0].userId}
        size={theme.componentSizes.avatar.small}
        borderRadius={borderRadius}
        style={styleOverride}
      />
    )
  }
  if (me == null) {
    return <></>
  }
  const notMe = _.find(members, member => member.userId !== me.userId)
  if (notMe == null) {
    return <></>
  }
  return (
    <ProfilePhoto
      userProfile={notMe}
      userId={notMe.userId}
      size={theme.componentSizes.avatar.small}
      borderRadius={borderRadius}
      style={styleOverride}
    />
  )
}

export default DMProfilePhoto
