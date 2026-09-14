import React, { FC } from 'react'
import { View } from 'react-native'

import { spacing } from '../../styles/const/spacing'
import { ProfilePhoto } from '../ProfilePhoto/ProfilePhoto.component'
import { Typography } from '../Typography/Typography.component'
import { LIST_TEXT_OPACITY } from './ListRow.component'

import type { PersonRowProps } from './CommunityHome.types'

/** Height of the design library's `List item--people` row. */
export const PERSON_ROW_HEIGHT = 40

/**
 * The design library's `List item--people`: a 24px avatar and a name, 40px tall
 * with 8px between them (Figma: Community home 5446:76594). Quiet has no direct
 * messages, so these rows are not tappable — they are the community's members.
 */
export const PersonRow: FC<PersonRowProps> = ({ user, testID }) => (
  <View
    testID={testID}
    accessibilityLabel={user.nickname}
    style={{
      height: PERSON_ROW_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    }}
  >
    <ProfilePhoto
      userId={user.userId}
      username={user.nickname}
      photo={user.photo}
      profilePhoto={user.profilePhoto}
      borderRadius={4}
      size={24}
    />
    <Typography variant={'body'} color={'charcoal'} numberOfLines={1} style={{ flex: 1, opacity: LIST_TEXT_OPACITY }}>
      {user.nickname}
    </Typography>
  </View>
)
