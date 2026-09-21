import React from 'react'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { PublicChannelStorage, UserProfile } from '@quiet/types'
import { DmChannelUserData } from './DirectMessagesPanel'
import ProfilePhotoWithBadge from '../../ProfilePhoto/ProfilePhotoWithBadge'
import SidebarRow from '../../ui/Sidebar/SidebarRow'

const PREFIX = 'DirectMessageListItem'

const classes = {
  me: `${PREFIX}me`,
}

/**
 * Which of these conversations is with yourself — an annotation, not a second name, so it is
 * smaller and quieter than the nickname rather than the same size merely greyed.
 *
 * On the purple sidebar a mid grey has too little contrast, and less still on a selected row,
 * which is that purple lightened. White at 60% keeps the same relationship to the text beside it
 * against every state the row has.
 */
const StyledAnnotation = styled(Typography)(() => ({
  [`&.${classes.me}`]: {
    fontSize: 12,
    lineHeight: '16px',
    letterSpacing: '0.4px',
    color: 'rgba(255, 255, 255, 0.6)',
    flexShrink: 0,
  },
}))

export interface DirectMessageListItemProps {
  channel: PublicChannelStorage
  me: UserProfile | undefined
  userProfiles: Record<string, UserProfile>
  userData: DmChannelUserData | undefined
  selected: boolean
  unread: boolean
  setCurrentChannel: (channelId: string) => void
}

/**
 * One conversation in the sidebar's "Direct messages" section — the Quiet Design Library's
 * `List item--people` (`4606:16448`): a 30px row, a 24px avatar at 4px radius, and the label at
 * white 70%, with the library's hover and selected overlays spanning the whole 220px column.
 *
 * The row's geometry and states come from `SidebarRow` so a DM row and a channel row share one
 * rhythm; only the avatar and the "you" annotation are this row's own.
 */
export const DirectMessageListItem: React.FC<DirectMessageListItemProps> = ({
  channel,
  me,
  userData,
  selected,
  unread,
  setCurrentChannel,
}) => {
  const isConversationWithMyself = userData != null && me != null && userData.user.userId === me.userId

  return (
    <SidebarRow
      variant='people'
      label={channel.displayedName}
      selected={selected}
      unread={unread}
      tabIndex={-1}
      onClick={() => {
        setCurrentChannel(channel.id)
      }}
      data-testid={`${channel.id}-dm-link`}
      labelTestId={`${channel.id}-dm-link-text`}
      glyph={<ProfilePhotoWithBadge userData={userData} channel={channel} />}
      annotation={
        isConversationWithMyself ? (
          <StyledAnnotation align='left' className={classes.me} data-testid={'dm-link-text-me'}>
            you
          </StyledAnnotation>
        ) : undefined
      }
    />
  )
}

export default DirectMessageListItem
