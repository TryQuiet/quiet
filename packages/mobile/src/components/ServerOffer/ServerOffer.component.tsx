import React, { FC, useCallback, useState } from 'react'
import { Image, ScrollView, TouchableOpacity, View } from 'react-native'

import { icons } from '../../assets'
import ServerBoxIcon from '../../assets/icons/svg/server-icon'
import { spacing } from '../../styles/const/spacing'
import { defaultTheme } from '../../styles/themes/default.theme'
import { Appbar } from '../Appbar/Appbar.component'
import { ONBOARDING_BLOCK_GAP, ONBOARDING_STAGE_INSET } from '../../styles/const/onboarding'
import { Button } from '../Button/Button.component'
import { Typography } from '../Typography/Typography.component'

/** The frame's glyph zone: a 64 box holding the 48×51 dns glyph. */
const GLYPH_BOX = 64
const GLYPH_WIDTH = 48
/** The library's checkbox (3623:11859): a 16 box, radius 3, a #999999 hairline, #7F7F7F when checked. */
const CHECKBOX_SIZE = 16
const CHECKBOX_RADIUS = 3
const CHECK_WIDTH = 10
const CHECK_HEIGHT = 8
/** The pill is 24 tall: 2 above and below its 14/20 label, off the 4px grid by the frame's own measure. */
const PILL_PADDING_Y = 2
/** The bare "Not now" link is 16 tall; slop brings it up to a finger's target. */
const LINK_SLOP = { top: 14, bottom: 14, left: 24, right: 24 }

export interface ServerOfferProps {
  /** An explicit decision: the server, or "Not now", each carrying the checkbox's value. */
  onClose: (useServer: boolean, dontShowAgain: boolean) => void
  /** The bar glyph: go back to the step before, deciding nothing. */
  onBack: () => void
  showDontShowAgain: boolean
  /** The checkbox's initial state; the component owns it from there. */
  defaultDontShowAgain?: boolean
}

/**
 * Want a server? · Figma 2922:10009, measured on the frame: the bar zone with
 * the × glyph and no title, then 24-spaced blocks — the glyph, the text
 * (heading, "It's free!" pill, body), the actions ("Use Quiet's server" and the
 * "Not now" link), the full-bleed rule and the "Don't show this again"
 * checkbox.
 *
 * A screen, not a sheet: the frame is a full screen, and the drawer it used to
 * arrive in is gone the same way Agree & join's was. The frame wires its glyph
 * to "back", so it returns to the step before rather than answering the offer;
 * "Not now" is the decline. The column scrolls, because at the larger font
 * scales the rule and the checkbox fall past the bottom of a phone.
 */
export const ServerOffer: FC<ServerOfferProps> = ({
  onClose,
  onBack,
  showDontShowAgain,
  defaultDontShowAgain = false,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(defaultDontShowAgain)

  const handleUseServer = useCallback(() => onClose(true, dontShowAgain), [onClose, dontShowAgain])
  const handleNotNow = useCallback(() => onClose(false, dontShowAgain), [onClose, dontShowAgain])
  const toggleDontShowAgain = useCallback(() => setDontShowAgain(value => !value), [])

  return (
    <View style={{ flex: 1, backgroundColor: defaultTheme.palette.background.white }} testID={'server-offer-component'}>
      <Appbar withoutTitle crossBackIcon back={onBack} backAccessibilityLabel={'Go back'} />
      <ScrollView
        testID={'server-offer-content'}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: ONBOARDING_STAGE_INSET,
          paddingBottom: spacing.xxl,
          alignItems: 'center',
          gap: ONBOARDING_BLOCK_GAP,
        }}
      >
        <View style={{ width: GLYPH_BOX, height: GLYPH_BOX, alignItems: 'center', justifyContent: 'center' }}>
          <ServerBoxIcon size={GLYPH_WIDTH} color={defaultTheme.palette.typography.gray90} />
        </View>

        <View style={{ alignSelf: 'stretch', paddingHorizontal: spacing.xl, alignItems: 'center', gap: spacing.lg }}>
          <View style={{ alignItems: 'center', gap: spacing.xs }}>
            <Typography variant={'h3'} color={'gray90'} horizontalTextAlign={'center'}>
              {'Want a server?'}
            </Typography>
            <View
              style={{
                borderRadius: spacing.xs,
                borderWidth: 1,
                borderColor: defaultTheme.palette.input.borderLightPurple,
                backgroundColor: defaultTheme.palette.background.lightPurple03,
                paddingHorizontal: spacing.sm,
                paddingVertical: PILL_PADDING_Y,
              }}
            >
              <Typography variant={'subtitle'} color={'darkPurple'}>
                {'It’s free!'}
              </Typography>
            </View>
          </View>
          <Typography variant={'body'} color={'gray90'} horizontalTextAlign={'center'}>
            {
              'Messages are still end-to-end encrypted, joining will be faster, and Quiet will work much better on iPhones.'
            }
          </Typography>
        </View>

        <View style={{ alignItems: 'center', gap: spacing.lg }}>
          <Button title={'Use Quiet’s server'} onPress={handleUseServer} newDesign testID={'server-offer-use-server'} />
          <TouchableOpacity onPress={handleNotNow} hitSlop={LINK_SLOP} testID={'server-offer-not-now'}>
            <Typography fontSize={16} lineHeight={16} color={'gray50'}>
              {'Not now'}
            </Typography>
          </TouchableOpacity>
        </View>

        {showDontShowAgain && (
          <>
            <View
              style={{ alignSelf: 'stretch', height: 1, backgroundColor: defaultTheme.palette.background.gray06 }}
            />
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
              onPress={toggleDontShowAgain}
              testID={'server-offer-dont-show-again'}
              hitSlop={{ top: spacing.md, bottom: spacing.md, left: spacing.md, right: spacing.md }}
              accessibilityRole='checkbox'
              accessibilityState={{ checked: dontShowAgain }}
              accessibilityLabel={'Don’t show this again'}
            >
              <View
                style={{
                  width: CHECKBOX_SIZE,
                  height: CHECKBOX_SIZE,
                  borderRadius: CHECKBOX_RADIUS,
                  borderWidth: 1,
                  borderColor: dontShowAgain
                    ? defaultTheme.palette.typography.gray50
                    : defaultTheme.palette.typography.grayDark,
                  backgroundColor: dontShowAgain
                    ? defaultTheme.palette.typography.gray50
                    : defaultTheme.palette.background.white,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {dontShowAgain && (
                  <Image
                    source={icons.icon_check_white}
                    resizeMode='contain'
                    accessible={false}
                    style={{ width: CHECK_WIDTH, height: CHECK_HEIGHT }}
                  />
                )}
              </View>
              <Typography variant={'body'} color={'gray90'}>
                {'Don’t show this again'}
              </Typography>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  )
}

export default ServerOffer
