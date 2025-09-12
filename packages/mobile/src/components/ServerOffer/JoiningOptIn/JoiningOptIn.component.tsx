import React, { FC, useState } from 'react'
import { View, TouchableOpacity, Linking } from 'react-native'
import { Button } from '../../Button/Button.component'
import { Typography } from '../../Typography/Typography.component'
import { defaultTheme } from '../../../styles/themes/default.theme'
// If you have a ServerBoxIcon for mobile, import it here and uncomment in the JSX
import ServerBoxIcon from '../../../assets/icons/svg/server-icon'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('JoiningOptInComponent')

const CHECK_SIZE = 14
const CHECK_BORDER = 2
const CHECK_RADIUS = 2

const SPACING_UNIT = 8
const GAP_CONTENT = SPACING_UNIT * 3 // 24px;
const GAP_TEXT = SPACING_UNIT * 2 // 16px;
const GAP_ACTIONS = SPACING_UNIT * 2 // 16px;

const serverHost = '' // You can pass the server host as a prop if needed
const privacyPolicyUrl = 'https://github.com/TryQuiet/quiet/wiki/Privacy-Policy-&-Terms-of-Use'

export interface JoiningOptInProps {
  visible: boolean
  onClose: (useServer: boolean) => void
  qssEndPoint?: string
}

export const JoiningOptIn: FC<JoiningOptInProps> = ({ visible, onClose, qssEndPoint }) => {
  const [agreedToTOS, setAgreedToTOS] = useState(false)
  const openLink = (url: string) => {
    if (!url) return
    Linking.openURL(url).catch(() => {})
  }
  const handleUseServer = () => {
    if (!agreedToTOS) return
    onClose(true)
  }

  const handleLeaveCommunity = () => {
    onClose(false)
  }

  if (!visible) return null

  return (
    <View style={{ flex: 1, backgroundColor: defaultTheme.palette.background.white }} testID={'server-offer-component'}>
      {/* Content */}
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: GAP_CONTENT,
          padding: 20,
        }}
      >
        {/* Text group */}
        <View style={{ alignItems: 'center', gap: GAP_TEXT }}>
          {/* Icon */}
          <View style={{ width: 64, height: 64, alignItems: 'center', justifyContent: 'center' }}>
            <ServerBoxIcon size={64} />
          </View>

          {/* Title */}
          <Typography fontSize={28} fontWeight={'bold'} style={{ textAlign: 'center' }}>
            This community is hosted on Quiet's Server
          </Typography>

          {/* Body copy */}
          <Typography fontSize={14} style={{ marginBottom: 24, textAlign: 'center' }}>
            This community uses a server {serverHost ? `(${serverHost} )` : ''}for messaging without Tor. By joining you
            agree to this{' '}
            <Typography
              fontSize={14}
              style={{ textDecorationLine: 'underline' }}
              onPress={() => openLink(privacyPolicyUrl)}
            >
              Privacy Policy and Terms of Use.
            </Typography>
          </Typography>
        </View>

        {/* Actions */}
        <View style={{ width: 'auto', gap: GAP_ACTIONS }}>
          <Button title={"Use Quiet's Server"} onPress={handleUseServer} disabled={!agreedToTOS} />
          <Button title={'Leave Community'} onPress={handleLeaveCommunity} negative />
        </View>

        {/* Don’t show again checkbox */}
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}
          onPress={() => setAgreedToTOS(prev => !prev)}
          testID={'server-offer-dont-show-again'}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View
            style={{
              width: CHECK_SIZE,
              height: CHECK_SIZE,
              borderRadius: CHECK_RADIUS,
              borderWidth: CHECK_BORDER,
              borderColor: agreedToTOS ? defaultTheme.palette.typography.gray50 : defaultTheme.palette.input.border,
              backgroundColor: agreedToTOS
                ? defaultTheme.palette.typography.gray50
                : defaultTheme.palette.background.white,
              marginRight: 10,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            accessibilityRole='checkbox'
            accessibilityState={{ checked: agreedToTOS }}
          >
            {agreedToTOS && (
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
            Agree to the{' '}
            <Typography
              fontSize={14}
              color={'subtitle'}
              style={{ textDecorationLine: 'underline' }}
              onPress={() => {
                // Open the link using Linking API
                Linking.openURL('https://github.com/TryQuiet/quiet/wiki/Privacy-Policy-&-Terms-of-Use')
              }}
            >
              Privacy Policy and Terms of Service
            </Typography>
          </Typography>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default JoiningOptIn
