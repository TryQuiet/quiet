import React, { FC } from 'react'
import { View } from 'react-native'

import { defaultTheme } from '../../styles/themes/default.theme'
import { Typography } from '../Typography/Typography.component'
import { UnreadDot } from './ListRow.component'

import type { CommunityIconProps } from './CommunityHome.types'

/**
 * The design library's `Community icon top-level`: the community's initial on a
 * pale lavender tile with a 4px radius, and the unread mark hung off the tile's
 * left edge (Figma: Title bar / Community 5446:75351).
 *
 * The design draws a stack of cards behind the tile for the community switcher.
 * Quiet holds one community at a time, so the tile stands alone.
 */
export const CommunityIcon: FC<CommunityIconProps> = ({ name, size, unread = false }) => {
  const initial = name.trim().slice(0, 1).toUpperCase()
  const dotSize = 10
  return (
    <View>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: 4,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: defaultTheme.palette.background.paleLavender,
        }}
      >
        <Typography fontSize={Math.round(size * 0.75)} color={'vividPurple'}>
          {initial}
        </Typography>
      </View>
      {unread && (
        <View
          style={{
            position: 'absolute',
            left: -4,
            top: (size - dotSize) / 2,
          }}
        >
          <UnreadDot size={dotSize} testID={'community_unread'} />
        </View>
      )}
    </View>
  )
}
