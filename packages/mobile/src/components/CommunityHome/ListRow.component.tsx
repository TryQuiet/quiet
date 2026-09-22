import React, { FC } from 'react'
import { Pressable, View } from 'react-native'

import { defaultTheme } from '../../styles/themes/default.theme'
import { spacing } from '../../styles/const/spacing'
import { Typography } from '../Typography/Typography.component'

import type { ListRowProps } from './CommunityHome.types'

/** Height of the design library's `List item` row. */
export const LIST_ROW_HEIGHT = 36

/**
 * The library draws every list label — row, section title and member name —
 * with the ink at 70% (Figma: `List group` 3797:16806 `Type=List`, whose
 * `List title` and `List item` text sit at opacity 0.7, the row glyph at 0.5
 * and `t-add` at 0.6). On the dark sidebar that ink is white; on the mobile
 * card it is #222222, which at 70% over white lands on #656565 — what the
 * exported Community home frames render.
 */
export const LIST_TEXT_OPACITY = 0.7

/**
 * The row's tapped state ("Tapped state for all clickable stuff" — the
 * designer's V1 note 6220:24045). The library's `List item` carries
 * Hover = white 5% and Selected = white 10%, both authored for the dark
 * sidebar and invisible on the white card. Its light-surface counterpart is
 * #F0F0F0, the library's light row fill (design-system ONBOARDING.md).
 */
export const LIST_ROW_PRESSED = defaultTheme.palette.background.gray06

/**
 * The design library's `List item`: a 12px glyph, a label and — when the row
 * has something unseen — the unread mark at the far right. 36px tall, 16px side
 * padding, 4px between glyph and label (Figma: Community home 5446:76594).
 */
export const ListRow: FC<ListRowProps> = ({ label, icon, onPress, unread = false, testID, accessibilityLabel }) => (
  <Pressable
    onPress={onPress}
    testID={testID}
    accessibilityRole='button'
    accessibilityLabel={accessibilityLabel ?? label}
    style={({ pressed }) => ({
      height: LIST_ROW_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      backgroundColor: pressed ? LIST_ROW_PRESSED : 'transparent',
    })}
  >
    <View style={{ width: 12, height: 12 }}>{icon}</View>
    <Typography variant={'body'} color={'charcoal'} numberOfLines={1} style={{ flex: 1, opacity: LIST_TEXT_OPACITY }}>
      {label}
    </Typography>
    {unread && <UnreadDot testID={testID ? `${testID}_unread` : undefined} />}
  </Pressable>
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
