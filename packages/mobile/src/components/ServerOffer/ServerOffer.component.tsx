import React, { FC, useState, useCallback } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { Button } from '../Button/Button.component'
import { Typography } from '../Typography/Typography.component'
import { defaultTheme } from '../../styles/themes/default.theme'
// If you have a mobile Appbar component, import it here
// Adjust the import path if your Appbar lives elsewhere
import { Appbar } from '../Appbar/Appbar.component'
// If you have a ServerBoxIcon for mobile, import it here and uncomment in the JSX
import ServerBoxIcon from '../../assets/icons/svg/server-icon'

const LIGHT_PURPLE = '#F3E8FF' // chip bg to match Figma

const CHECK_SIZE = 14
const CHECK_BORDER = 2
const CHECK_RADIUS = 2

export interface ServerOfferProps {
  visible: boolean
  /**
   * Called when the user makes a choice. `useServer` is true when the primary CTA is selected.
   * `dontShowAgain` is the state of the checkbox.
   */
  onClose: (useServer: boolean, dontShowAgain: boolean) => void
}

export const ServerOffer: FC<ServerOfferProps> = ({ visible, onClose }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false)

  const handleUseServer = useCallback(() => {
    onClose(true, dontShowAgain)
  }, [onClose, dontShowAgain])

  const handleNotNow = useCallback(() => {
    onClose(false, dontShowAgain)
  }, [onClose, dontShowAgain])

  if (!visible) return null

  return (
    <View style={{ flex: 1, backgroundColor: defaultTheme.palette.background.white }} testID={'server-offer-component'}>
      {/* Top app bar */}
      {/** If Appbar is not available in your project, remove this and keep the rest **/}
      <Appbar title={'Want a server?'} back={handleNotNow} />

      {/* Content */}
      <View style={{ flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' }}>
        {/* Icon */}
        <View style={{ marginBottom: 16, width: 64, height: 64, alignItems: 'center', justifyContent: 'center' }}>
          <ServerBoxIcon />
        </View>

        {/* Title */}
        <Typography fontSize={24} fontWeight={'bold'} style={{ marginBottom: 8 }}>
          Want a server?
        </Typography>

        {/* Pill: It’s free! */}
        <View
          style={{
            marginBottom: 8,
            borderRadius: 4,
            borderWidth: 1,
            borderColor: defaultTheme.palette.typography.veryLightGray,
            backgroundColor: LIGHT_PURPLE,
            paddingHorizontal: 10,
            paddingVertical: 2,
          }}
        >
          <Typography fontSize={14} fontWeight={'medium'} style={{ color: defaultTheme.palette.main.brand }}>
            It’s free!
          </Typography>
        </View>

        {/* Body copy */}
        <Typography fontSize={14} color={'subtitle'} style={{ textAlign: 'center', marginBottom: 32, maxWidth: 320 }}>
          Messages are still end-to-end encrypted, joining will be faster, and Quiet will work much better on iPhones.
        </Typography>

        {/* Primary CTA */}
        <View style={{ width: '100%', marginBottom: 16 }}>
          <Button title={'Add server'} onPress={handleUseServer} />
          {/** If you want to match the screenshot label exactly, change the title to 'Add server' **/}
        </View>

        {/* Secondary CTA */}
        <View style={{ width: '100%', marginBottom: 24 }}>
          <Button title={'Not now'} onPress={handleNotNow} negative />
        </View>

        {/* Divider */}
        <View style={{ width: '100%', marginTop: 24 }}>
          <View style={{ width: '100%', height: 1, backgroundColor: defaultTheme.palette.appBar.gray }} />
        </View>

        {/* Don’t show again checkbox */}
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingVertical: 8 }}
          onPress={() => setDontShowAgain(v => !v)}
          testID={'server-offer-dont-show-again'}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View
            style={{
              width: CHECK_SIZE,
              height: CHECK_SIZE,
              borderRadius: CHECK_RADIUS,
              borderWidth: CHECK_BORDER,
              borderColor: dontShowAgain ? defaultTheme.palette.typography.gray50 : defaultTheme.palette.input.border,
              backgroundColor: dontShowAgain
                ? defaultTheme.palette.typography.gray50
                : defaultTheme.palette.background.white,
              marginRight: 10,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            accessibilityRole='checkbox'
            accessibilityState={{ checked: dontShowAgain }}
          >
            {dontShowAgain && (
              <Typography
                fontSize={10}
                fontWeight={'bold'}
                style={{
                  color: defaultTheme.palette.main.white,
                  lineHeight: CHECK_SIZE - CHECK_BORDER,
                  textAlign: 'center',
                }}
              >
                ✓
              </Typography>
            )}
          </View>
          <Typography fontSize={14} color={'subtitle'}>
            Don’t show this again
          </Typography>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default ServerOffer
