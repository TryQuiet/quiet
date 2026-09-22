import React, { FC } from 'react'
import { Pressable, View } from 'react-native'

import { defaultTheme } from '../../styles/themes/default.theme'
import { spacing } from '../../styles/const/spacing'
import { ProfilePhotoWithBadge } from '../ProfilePhoto/ProfilePhotoWithBadge.component'
import { ProfilePhotoSize } from '../ProfilePhoto/ProfilePhoto.types'
import { Typography } from '../Typography/Typography.component'
import { LIST_ROW_PRESSED, LIST_TEXT_OPACITY, UnreadDot } from './ListRow.component'

import type { PersonRowProps } from './CommunityHome.types'

/** Height of the design library's `List item--people` row. */
export const PERSON_ROW_HEIGHT = 40

/**
 * The design library's `List item--people`: a 24px avatar and a name, 40px tall
 * with 8px between them (Figma: Community home 5446:76594).
 *
 * The row opens a direct message, so it takes the library's tapped state for
 * `List item--people` (4606:16448) the way every other clickable row does —
 * white 5%/10% on the dark sidebar, its light-surface counterpart #F0F0F0 here.
 * The avatar carries the other person's presence badge, as the channel list
 * does elsewhere in the app.
 */
export const PersonRow: FC<PersonRowProps> = ({ conversation, onPress, testID }) => (
  <Pressable
    onPress={onPress}
    testID={testID}
    accessibilityRole='button'
    accessibilityLabel={`${conversation.name}, direct message`}
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
      userData={conversation.userData}
      channel={conversation.channel}
      size={ProfilePhotoSize.SMALL}
    />
    <Typography variant={'body'} color={'charcoal'} numberOfLines={1} style={{ opacity: LIST_TEXT_OPACITY }}>
      {conversation.name}
    </Typography>
    {conversation.isMe && (
      <Typography
        variant={'body'}
        numberOfLines={1}
        style={{ opacity: LIST_TEXT_OPACITY, color: defaultTheme.palette.typography.grayLight }}
      >
        you
      </Typography>
    )}
    <View style={{ flex: 1 }} />
    {conversation.unread && <UnreadDot testID={testID ? `${testID}_unread` : undefined} />}
  </Pressable>
)
