import React from 'react'
import { storiesOf } from '@storybook/react-native'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Appbar } from './Appbar.component'
import { Typography } from '../Typography/Typography.component'
import { defaultTheme } from '../../styles/themes/default.theme'

/**
 * Spec for the top status-bar treatment.
 *
 * The brand purple runs to the very top of the screen — behind the OS clock, camera cutout and
 * status icons — rather than stopping below them. App.tsx does this by painting a top-edge-only
 * SafeAreaView in `main.brand` and setting StatusBar barStyle to 'light-content'.
 *
 * Why it is painted rather than set via StatusBar.backgroundColor: the app targets SDK 35, where
 * Android forces edge-to-edge and ignores setStatusBarColor, and iOS has no status-bar background
 * API at all. Painting the inset works the same way on both.
 *
 * This story cannot move the real OS status bar, which Storybook draws over the whole app shell, so
 * the strip below stands in for it at the real inset height for this device.
 */
const StatusBarSpec: React.FC<{ purpleBar: boolean }> = ({ purpleBar }) => {
  const insets = useSafeAreaInsets()
  return (
    <View style={{ flex: 1, backgroundColor: defaultTheme.palette.background.white }}>
      <View
        style={{
          height: Math.max(insets.top, 24),
          backgroundColor: defaultTheme.palette.main.brand,
          justifyContent: 'center',
          paddingHorizontal: 16,
        }}
      >
        <Typography fontSize={10} style={{ color: defaultTheme.palette.typography.white }}>
          {'status bar inset — OS clock and icons sit here, light-content'}
        </Typography>
      </View>
      <Appbar
        title={purpleBar ? 'dm-secure' : 'New message'}
        position={purpleBar ? 'flex-start' : 'center'}
        style={purpleBar ? { backgroundColor: defaultTheme.palette.main.brand, borderBottomWidth: 0 } : undefined}
        iconColor={purpleBar ? defaultTheme.palette.typography.white : undefined}
        textColor={purpleBar ? 'white' : undefined}
      />
      <View style={{ padding: 16 }}>
        <Typography fontSize={12} style={{ color: defaultTheme.palette.typography.gray50 }}>
          {purpleBar
            ? 'Community home: purple strip meets a purple app bar, so they read as one surface.'
            : 'White-header screen: the purple strip continues above a white app bar. Accepted by the designer.'}
        </Typography>
      </View>
    </View>
  )
}

storiesOf('Foundations/Status bar', module)
  .add('Purple bar screen (community home)', () => <StatusBarSpec purpleBar={true} />)
  .add('White bar screen (new message)', () => <StatusBarSpec purpleBar={false} />)
