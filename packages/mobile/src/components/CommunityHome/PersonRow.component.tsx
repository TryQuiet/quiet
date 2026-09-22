import React, { FC } from 'react'
import { Pressable, View } from 'react-native'

import { defaultTheme } from '../../styles/themes/default.theme'
import { spacing } from '../../styles/const/spacing'
import { TAP_FEEDBACK_DELAY_MS } from '../../utils/const/tapFeedback'
import { ProfilePhotoWithBadge } from '../ProfilePhoto/ProfilePhotoWithBadge.component'
import { ProfilePhotoSize } from '../ProfilePhoto/ProfilePhoto.types'
import { Typography } from '../Typography/Typography.component'
import { LIST_ROW_PRESSED, LIST_TEXT_OPACITY, UnreadDot } from './ListRow.component'

import type { PersonRowProps } from './CommunityHome.types'

/** Height of the design library's `List item--people` row. */
export const PERSON_ROW_HEIGHT = 40

/**
 * The design library's `List item--people`: a 24px avatar at radius 4 and a
 * name, 40px tall with 8px between them (Figma: Community home 5446:76594,
 * the row itself 4606:16448).
 *
 * The row is the community's member, and tapping it opens the direct message
 * with them — or the composer with them already chosen, when there is no
 * conversation yet. That makes it clickable, so it takes the library's tapped
 * state for `List item--people` (4606:16448) like every other clickable row:
 * white 5%/10% on the dark sidebar, its light-surface counterpart #F0F0F0 here.
 *
 * Like every row on this card it sits in a scroll view, so the fill waits out
 * `TAP_FEEDBACK_DELAY_MS` rather than following the first frame of a flick.
 *
 * The avatar carries the member's presence badge, the same one the DM list
 * shows elsewhere in the app, and the row takes the unread mark at its far
 * right when the conversation with this person has something unseen — the
 * frame's `badge2` on `List item--people`, degraded to a dot because Quiet
 * records unread as a flag rather than a count.
 */
export const PersonRow: FC<PersonRowProps> = ({ user, onPress, testID }) => (
  <Pressable
    onPress={onPress}
    unstable_pressDelay={TAP_FEEDBACK_DELAY_MS}
    testID={testID}
    accessibilityRole='button'
    accessibilityLabel={`${user.nickname}, send a direct message`}
    style={({ pressed }) => ({
      height: PERSON_ROW_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      backgroundColor: pressed ? LIST_ROW_PRESSED : 'transparent',
    })}
  >
    <ProfilePhotoWithBadge
      userData={{
        connected: user.connected,
        user: {
          userId: user.userId,
          nickname: user.nickname,
          photo: user.photo,
          profilePhoto: user.profilePhoto,
        },
      }}
      size={ProfilePhotoSize.SMALL}
    />
    <Typography
      variant={'body'}
      color={'charcoal'}
      numberOfLines={1}
      style={{ opacity: LIST_TEXT_OPACITY, flexShrink: 1 }}
    >
      {user.nickname}
    </Typography>
    {user.isMe && (
      <Typography
        variant={'body'}
        numberOfLines={1}
        style={{ opacity: LIST_TEXT_OPACITY, color: defaultTheme.palette.typography.grayLight }}
      >
        you
      </Typography>
    )}
    <View style={{ flex: 1 }} />
    {user.unread && <UnreadDot testID={testID ? `${testID}_unread` : undefined} />}
  </Pressable>
)
