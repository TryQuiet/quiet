import React, { FC, useEffect, useRef } from 'react'
import { Animated, Easing, View } from 'react-native'

import { defaultTheme } from '../../styles/themes/default.theme'
import { Typography } from '../Typography/Typography.component'

import type { ActionProgressProps } from './ActionProgress.types'

/** Progress bar base 2 (5390:18021): a 300x4 track, radius 100, and a fill no shorter than 8. */
const TRACK_WIDTH = 300
const TRACK_HEIGHT = 4
const MIN_FILL = 8

/** The sweep the joining screen already runs, so the two bars read alike. */
const INDETERMINATE_DURATION_MS = 4000

/**
 * An action in progress: the library's progress bar with a status line under it
 * (Progress bar 2 / With text=True, 5390:19570; Progress bar base 2, 5390:18021) —
 * the React Native counterpart of desktop's ui/ActionProgress (#3518). The fill is
 * teal #67BFD3, the decision of record; never a greyed-out button with the status
 * inside it. Without `value` the fill sweeps 8 → 300 over 4s, linear, forever.
 */
export const ActionProgress: FC<ActionProgressProps> = ({ status, secondary, value, testID = 'action-progress' }) => {
  const determinate = typeof value === 'number' && Number.isFinite(value)
  const sweep = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (determinate) return
    const loop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: INDETERMINATE_DURATION_MS,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    )
    loop.start()
    return () => loop.stop()
  }, [determinate, sweep])

  const fillWidth = determinate
    ? Math.max(MIN_FILL, Math.min(1, Math.max(0, value as number)) * TRACK_WIDTH)
    : sweep.interpolate({ inputRange: [0, 1], outputRange: [MIN_FILL, TRACK_WIDTH] })

  return (
    <View style={{ alignItems: 'center', gap: 6, width: TRACK_WIDTH, maxWidth: '100%' }} testID={testID}>
      <View
        style={{
          width: '100%',
          height: TRACK_HEIGHT,
          borderRadius: 100,
          backgroundColor: defaultTheme.palette.background.gray06,
          overflow: 'hidden',
        }}
        accessibilityRole='progressbar'
      >
        <Animated.View
          style={{
            height: TRACK_HEIGHT,
            borderRadius: 100,
            backgroundColor: defaultTheme.palette.background.lushSky,
            width: fillWidth,
          }}
          testID={`${testID}-fill`}
        />
      </View>
      <Typography variant={'body'} horizontalTextAlign={'center'} testID={`${testID}-status`}>
        {status}
      </Typography>
      {secondary ? (
        <Typography variant={'caption'} color={'gray50'} horizontalTextAlign={'center'}>
          {secondary}
        </Typography>
      ) : null}
    </View>
  )
}
