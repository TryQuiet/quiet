import React, { FC } from 'react'
import { View, Text, Linking } from 'react-native'
import { Button } from '../Button/Button.component'
import { Typography } from '../Typography/Typography.component'
import { defaultTheme } from '../../styles/themes/default.theme'
import { Appbar } from '../Appbar/Appbar.component'

export type TermsOfServiceProps = {
  onAgree: () => void
  onBack: () => void
  serverHost?: string
}

const privacyPolicyUrl = 'https://github.com/TryQuiet/quiet/wiki/Privacy-Policy-&-Terms-of-Use'

export const TermsOfService: FC<TermsOfServiceProps> = ({ onAgree, onBack, serverHost = '' }) => {
  const openLink = (url: string) => {
    if (!url) return
    Linking.openURL(url).catch(() => {})
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: defaultTheme.palette.background.white,
      }}
      testID={'terms-of-service-component'}
    >
      <Appbar title={'Terms of Use'} back={onBack} />

      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          padding: 20,
          gap: 16,
        }}
      >
        <Typography fontSize={14} style={{ marginBottom: 24, textAlign: 'center' }}>
          This community uses a server {serverHost ? `(${serverHost} )` : ''}for end-to-end encrypted messaging without
          Tor. By joining you agree to this{' '}
          <Text onPress={() => openLink(privacyPolicyUrl)} style={{ textDecorationLine: 'underline' }}>
            Privacy Policy and Terms of Use.
          </Text>
        </Typography>
        <View style={{ gap: 16 }}>
          <Button title={'Agree & Continue'} onPress={onAgree} />
          <Button title={'Leave Community'} onPress={onBack} negative />
        </View>
      </View>
    </View>
  )
}

export default TermsOfService
