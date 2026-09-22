import React, { FC } from 'react'
import { TouchableOpacity, View } from 'react-native'

import { defaultTheme } from '../../styles/themes/default.theme'
import { spacing } from '../../styles/const/spacing'
import { CaretRightIcon } from '../../assets/icons/svg/onboarding-icons'
import { Typography } from '../Typography/Typography.component'

import type { ActionRowProps } from './ActionRow.types'

/**
 * The design library's "Button row": icon · label (· subtitle) · caret with a
 * hairline below. Distances are spacing roles on the 4px grid and text styles
 * come from the type scale, so the row matches its desktop counterpart.
 */
export const ActionRow: FC<ActionRowProps> = ({ icon, label, subtitle, onPress, disabled = false, testID }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    testID={testID}
    accessibilityRole='button'
    accessibilityState={{ disabled }}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: defaultTheme.palette.typography.veryLightGray,
      opacity: disabled ? 0.4 : 1,
    }}
  >
    <View style={{ width: 24, height: 24 }}>{icon}</View>
    <View style={{ flex: 1 }}>
      <Typography variant={'bodyLg'}>{label}</Typography>
      {subtitle ? (
        <Typography variant={'caption'} color={'gray50'}>
          {subtitle}
        </Typography>
      ) : null}
    </View>
    <CaretRightIcon />
  </TouchableOpacity>
)
