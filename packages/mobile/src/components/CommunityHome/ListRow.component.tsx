import React, { FC } from 'react'
import { Pressable, View } from 'react-native'

import { defaultTheme } from '../../styles/themes/default.theme'
import { spacing } from '../../styles/const/spacing'
import { TAP_FEEDBACK_DELAY_MS } from '../../utils/const/tapFeedback'
import { Typography } from '../Typography/Typography.component'

import type { ListRowProps } from './CommunityHome.types'

/** Height of the design library's `List item` row. */
export const LIST_ROW_HEIGHT = 36

/**
 * Every list label on this card — row, section title and member name — is drawn
 * at 70% of #222222, which over white lands on #656565.
 *
 * That greyness is the design's, not an accident of reusing a dark-sidebar
 * component. The mobile Community home frame itself (Figma: Quiet Design
 * Library, Structure & Nav, `Community home` 5446:76594 variant "Mode=Light,
 * Content=For V1 2025" 6220:10609, the 375pt-wide mobile frame) gives each
 * label text node its own `opacity: 0.7` over a solid #222222 fill: the
 * `List item` labels (Add members I6220:10613;3797:16032, General
 * I6220:10616;3797:16032), the `List title` labels (Channels
 * I6220:10615;3797:15987, Direct messages I6220:10876;3797:15987) and the
 * person rows' `Name` (I6220:10877;4606:16451). The row glyph sits at 0.5 and
 * `t-add` at 0.6. Only the unread badge's digits are solid.
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
 *
 * The rows are inside the card's scroll view, so the tapped fill waits out
 * `TAP_FEEDBACK_DELAY_MS` and a flick down the list never lights one up.
 */
export const ListRow: FC<ListRowProps> = ({ label, icon, onPress, unread = false, testID, accessibilityLabel }) => (
  <Pressable
    onPress={onPress}
    unstable_pressDelay={TAP_FEEDBACK_DELAY_MS}
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
