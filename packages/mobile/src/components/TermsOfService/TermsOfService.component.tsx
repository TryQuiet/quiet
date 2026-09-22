import React, { FC } from 'react'
import { Text, Linking } from 'react-native'
import { Typography } from '../Typography/Typography.component'
import { AgreeAndJoin } from '../AgreeAndJoin/AgreeAndJoin.component'

export type TermsOfServiceProps = {
  onAgree: () => void
  /** The back arrow: the user did not agree. */
  onBack: () => void
  /** The host the copy names, e.g. api.tryquiet.org. */
  serverHost?: string
}

const privacyPolicyUrl = 'https://github.com/TryQuiet/quiet/wiki/Privacy-Policy'

/**
 * Agree & join · Figma 3054:4090 (server opt-in) / 2811:2724 (joiner). The
 * screen is the shared AgreeAndJoin shell, which the device-link consent step
 * also uses; this one carries the policy copy.
 */
export const TermsOfService: FC<TermsOfServiceProps> = ({ onAgree, onBack, serverHost }) => {
  const openLink = () => {
    Linking.openURL(privacyPolicyUrl).catch(() => {})
  }

  return (
    <AgreeAndJoin
      onAgree={onAgree}
      onBack={onBack}
      testID={'terms-of-service-component'}
      agreeTestID={'terms-of-service-agree'}
    >
      <Typography variant={'body'}>
        This community uses a server {serverHost ? `(${serverHost}) ` : ''}for messaging without Tor. By joining you
        agree to this{' '}
        <Text onPress={openLink} accessibilityRole='link' style={{ textDecorationLine: 'underline' }}>
          Privacy Policy and Terms of Use
        </Text>
        .
      </Typography>
    </AgreeAndJoin>
  )
}

export default TermsOfService
