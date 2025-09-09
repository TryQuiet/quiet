import React, { FC, useState, useCallback } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { Button } from '../../Button/Button.component'
import { Typography } from '../../Typography/Typography.component'
import { defaultTheme } from '../../../styles/themes/default.theme'
// If you have a ServerBoxIcon for mobile, import it here and uncomment in the JSX
import ServerBoxIcon from '../../../assets/icons/svg/server-icon'

const SPACING_UNIT = 8
const GAP_CONTENT = SPACING_UNIT * 3 // 24px;
const GAP_TEXT = SPACING_UNIT * 2 // 16px;
const GAP_ACTIONS = SPACING_UNIT * 2 // 16px;

export interface JoiningOptInProps {
  visible: boolean
  onClose: (useServer: boolean) => void
  qssEndPoint?: string
}

export const JoiningOptIn: FC<JoiningOptInProps> = ({ visible, onClose, qssEndPoint }) => {
  const handleUseServer = useCallback(() => {
    onClose(true)
  }, [onClose])

  const handleLeaveCommunity = useCallback(() => {
    onClose(false)
  }, [onClose])

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
          <Typography fontSize={14} color={'subtitle'} style={{ textAlign: 'center', maxWidth: 320 }}>
            This community's admins have added a server ({qssEndPoint ?? 'qss.tryquiet.org'}) for more speed and
            reliability. Quiet will connect to the server without Tor, so this comes at the cost of Tor's anonymity
            protection. Would you like to use the server or leave the community?
          </Typography>
        </View>

        {/* Actions */}
        <View style={{ width: 'auto', gap: GAP_ACTIONS }}>
          <Button title={"Use Quiet's Server"} onPress={handleUseServer} />
          <Button title={'Leave Community'} onPress={handleLeaveCommunity} negative />
        </View>
      </View>
    </View>
  )
}

export default JoiningOptIn
