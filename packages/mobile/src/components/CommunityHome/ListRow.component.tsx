import React, { FC } from 'react'
import { TouchableOpacity, View } from 'react-native'

import { defaultTheme } from '../../styles/themes/default.theme'
import { spacing } from '../../styles/const/spacing'
import { Typography } from '../Typography/Typography.component'

import type { ListRowProps } from './CommunityHome.types'

/** Height of the design library's `List item` row. */
export const LIST_ROW_HEIGHT = 36

/**
 * The library draws every list label — row, section title and member name —
 * with the ink at 70% (Figma: Community home 5446:76594, the `List item`,
 * `List title` and `List item--people` text nodes all carry opacity 0.7). Over
 * the white card that lands on #656565, which is what the exported frames show.
 */
export const LIST_TEXT_OPACITY = 0.7

/**
 * The design library's `List item`: a 12px glyph, a label and — when the row
 * has something unseen — the unread mark at the far right. 36px tall, 16px side
 * padding, 4px between glyph and label (Figma: Community home 5446:76594).
 */
export const ListRow: FC<ListRowProps> = ({ label, icon, onPress, unread = false, testID, accessibilityLabel }) => (
  <TouchableOpacity
    onPress={onPress}
    testID={testID}
    accessibilityRole='button'
    accessibilityLabel={accessibilityLabel ?? label}
    style={{
      height: LIST_ROW_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    }}
  >
    <View style={{ width: 12, height: 12 }}>{icon}</View>
    <Typography variant={'body'} color={'charcoal'} numberOfLines={1} style={{ flex: 1, opacity: LIST_TEXT_OPACITY }}>
      {label}
    </Typography>
    {unread && <UnreadDot testID={testID ? `${testID}_unread` : undefined} />}
  </TouchableOpacity>
)

/**
 * The design's `badge2` carries an unread count. Quiet only records unread as a
 * flag, so the badge degrades to a dot in its colour and position rather than
 * inventing a number.
 */
export const UnreadDot: FC<{ size?: number; testID?: string }> = ({ size = 8, testID }) => (
  <View
    testID={testID}
    accessibilityLabel='Unread messages'
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: defaultTheme.palette.typography.error,
    }}
  />
)
