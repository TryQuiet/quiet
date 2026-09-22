import React, { FC } from 'react'
import { Pressable } from 'react-native'

import { defaultTheme } from '../../styles/themes/default.theme'
import { spacing } from '../../styles/const/spacing'
import { ProfilePhotoWithBadge } from '../ProfilePhoto/ProfilePhotoWithBadge.component'
import { ProfilePhotoSize } from '../ProfilePhoto/ProfilePhoto.types'
import { Typography } from '../Typography/Typography.component'
import { LIST_ROW_PRESSED, LIST_TEXT_OPACITY } from './ListRow.component'

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
 * The avatar carries the member's presence badge, the same one the DM list
 * shows elsewhere in the app.
 */
export const PersonRow: FC<PersonRowProps> = ({ user, onPress, testID }) => (
  <Pressable
    onPress={onPress}
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
    <Typography variant={'body'} color={'charcoal'} numberOfLines={1} style={{ opacity: LIST_TEXT_OPACITY }}>
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
  </Pressable>
)
