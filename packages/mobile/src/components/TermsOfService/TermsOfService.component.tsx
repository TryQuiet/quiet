import React, { FC } from 'react'
import { View, Text, Linking } from 'react-native'
import { Button } from '../Button/Button.component'
import { Typography } from '../Typography/Typography.component'
import { defaultTheme } from '../../styles/themes/default.theme'
import { spacing } from '../../styles/const/spacing'
import { Appbar } from '../Appbar/Appbar.component'

export type TermsOfServiceProps = {
  onAgree: () => void
  /** The back arrow: the user did not agree. */
  onBack: () => void
  /** The host the copy names, e.g. api.tryquiet.org. */
  serverHost?: string
}

const privacyPolicyUrl = 'https://github.com/TryQuiet/quiet/wiki/Privacy-Policy'

/**
 * Agree & join · Figma 3054:4090 (server opt-in) / 2811:2724 (joiner): a
 * titled bar ("Agree & join", back arrow, hairline — this one is designed
 * titled), one left-aligned paragraph naming the host with the policy and
 * terms as one underlined link, and one button. Nothing else.
 */
export const TermsOfService: FC<TermsOfServiceProps> = ({ onAgree, onBack, serverHost }) => {
  const openLink = () => {
    Linking.openURL(privacyPolicyUrl).catch(() => {})
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: defaultTheme.palette.background.white,
      }}
      testID={'terms-of-service-component'}
    >
      <Appbar title={'Agree & join'} back={onBack} />
      <View style={{ padding: spacing.lg, gap: spacing.lg, alignItems: 'flex-start' }}>
        <Typography variant={'body'}>
          This community uses a server {serverHost ? `(${serverHost}) ` : ''}for messaging without Tor. By joining you
          agree to this{' '}
          <Text onPress={openLink} accessibilityRole='link' style={{ textDecorationLine: 'underline' }}>
            Privacy Policy and Terms of Use
          </Text>
          .
        </Typography>
        <Button title={'Agree & Join'} onPress={onAgree} newDesign testID={'terms-of-service-agree'} />
      </View>
    </View>
  )
}

export default TermsOfService
