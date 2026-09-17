import React from 'react'
import { useTheme } from '@mui/material/styles'

import { UserProfile } from '@quiet/types'
import ProfilePhoto from '../../ProfilePhoto/ProfilePhoto'
import ProfilePhotoWithBadge from '../../ProfilePhoto/ProfilePhotoWithBadge'
import { ProfilePhotoSize } from '../../ProfilePhoto/ProfilePhoto.types'
import _ from 'lodash'

export interface DMProfilePhotoProps {
  members: UserProfile[]
  me: UserProfile | undefined
  /**
   * Presence for this conversation, from `isDmConnected`. The channel header passes it so the top
   * bar and the sidebar row for the same DM never disagree; the context menu and the new-message
   * header leave it out and get no dot.
   */
  connected?: boolean
  borderRadius?: number
  style?: React.CSSProperties
}

const STYLE: React.CSSProperties = {
  paddingBottom: 0,
  padding: 0,
  marginLeft: -2,
  marginRight: 2,
  marginBottom: 0,
  fontSize: '1rem',
  lineHeight: '1.68',
  borderRadius: 4,
}

const DMProfilePhoto: React.FC<DMProfilePhotoProps> = ({ members, me, connected, borderRadius = 4, style = {} }) => {
  const theme = useTheme()
  const styleOverride = {
    ...STYLE,
    ...style,
  }

  let subject: UserProfile | undefined
  if (_.size(members) === 1) {
    subject = members[0]
  } else {
    if (me == null) return <></>
    subject = _.find(members, member => member.userId !== me.userId)
  }
  if (subject == null) {
    return <></>
  }

  if (connected != null) {
    return (
      <ProfilePhotoWithBadge
        userData={{ user: subject, connected }}
        size={ProfilePhotoSize.SMALL}
        borderRadius={borderRadius}
      />
    )
  }

  return (
    <ProfilePhoto
      userProfile={subject}
      userId={subject.userId}
      size={theme.componentSizes.avatar.small}
      borderRadius={borderRadius}
      style={styleOverride}
    />
  )
}

export default DMProfilePhoto
