import React, { FC } from 'react'
import { View } from 'react-native'
import { Button } from '../Button/Button.component'
import { Typography } from '../Typography/Typography.component'
import { defaultTheme } from '../../styles/themes/default.theme'
import ServerBoxIcon from '../../assets/icons/svg/server-icon'
import { createLogger } from '../../utils/logger'

const logger = createLogger('ServerAdded:component')

const SPACING_UNIT = 8
const GAP_CONTENT = SPACING_UNIT * 3 // 24px;
const GAP_TEXT = SPACING_UNIT * 2 // 16px;
const GAP_ACTIONS = SPACING_UNIT * 2 // 16px;

export interface ServerAddedComponentProps {
  visible: boolean
  onChoose: (useServer: boolean) => void
  serverHosts: string[]
}

export const ServerAddedComponent: FC<ServerAddedComponentProps> = ({ visible, onChoose, serverHosts }) => {
  // Determine if we should show "Quiet's"
  const isQuietServer = serverHosts.length === 1 && serverHosts[0] === process.env.QSS_ENDPOINT

  if (!visible) return null

  return (
    <View style={{ flex: 1, backgroundColor: defaultTheme.palette.background.white }} testID={'server-added-component'}>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: GAP_CONTENT,
          padding: 20,
        }}
      >
        <View style={{ alignItems: 'center', gap: GAP_TEXT }}>
          <View style={{ width: 64, height: 64, alignItems: 'center', justifyContent: 'center' }}>
            <ServerBoxIcon size={64} />
          </View>
          <Typography fontSize={28} fontWeight={'bold'} style={{ textAlign: 'center' }}>
            {isQuietServer ? 'This community is hosted on Quiet’s server' : 'This community is hosted on a server'}
          </Typography>
          <Typography fontSize={14} style={{ marginBottom: 24, textAlign: 'center' }}>
            This community's admins have added a server (
            {isQuietServer ? serverHosts[0] : serverHosts.length > 1 ? serverHosts.join(', ') : serverHosts[0]})
            {isQuietServer ? ' for more speed and reliability' : ''}. Quiet will connect to the server without Tor, so
            this comes at the cost of Tor's anonymity protection. Would you like to use the server or leave the
            community?
          </Typography>
        </View>
        <View style={{ width: 'auto', gap: GAP_ACTIONS }}>
          <Button title={'Continue With Server'} onPress={() => onChoose(true)} />
          <Button title={'Leave Community'} onPress={() => onChoose(false)} negative />
        </View>
      </View>
    </View>
  )
}

export default ServerAddedComponent
