import React, { FC } from 'react'
import { Image, View } from 'react-native'
import { Button } from '../Button/Button.component'
import { Typography } from '../Typography/Typography.component'
import { defaultTheme } from '../../styles/themes/default.theme'
import ServerBoxIcon from '../../assets/icons/svg/server-icon'
import { icons } from '../../assets'

const SPACING_UNIT = 8
const GAP_CONTENT = SPACING_UNIT * 3 // 24px;
const GAP_TEXT = SPACING_UNIT * 2 // 16px;
const GAP_ACTIONS = SPACING_UNIT * 2 // 16px;

const LOCAL_QSS_HOST_PATTERN =
  /^(?:(?:.+\.)?localhost|(?:.+\.)?local|host\.docker\.internal|0\.0\.0\.0|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|169\.254\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+|::1|f[cd][0-9a-f]{2}:.*|fe[89ab][0-9a-f]:.*)$/i

const normalizeServerHost = (serverHost: string | undefined): string | undefined => {
  if (!serverHost) return undefined

  try {
    const endpoint = /^[a-z][a-z\d+.-]*:\/\//i.test(serverHost) ? serverHost : `ws://${serverHost}`
    const hostname = new URL(endpoint).hostname.toLowerCase().replace(/^\[|\]$/g, '')
    return LOCAL_QSS_HOST_PATTERN.test(hostname) ? 'localhost' : hostname
  } catch {
    return serverHost.toLowerCase()
  }
}

export const isConfiguredQuietServer = (serverHost: string, qssEndpoint: string | undefined): boolean => {
  const normalizedQssHost = normalizeServerHost(qssEndpoint)
  return normalizedQssHost != null && normalizeServerHost(serverHost) === normalizedQssHost
}

export interface ServerAddedComponentProps {
  visible: boolean
  onChoose: (useServer: boolean) => void
  serverHosts: string[]
}

export const ServerAddedComponent: FC<ServerAddedComponentProps> = ({ visible, onChoose, serverHosts }) => {
  const isQuietServer = serverHosts.length === 1 && isConfiguredQuietServer(serverHosts[0], process.env.QSS_ENDPOINT)
  const serverList = serverHosts.join(', ')
  const serverDescription = isQuietServer
    ? `This community's admins have added a server (${serverList}) for more speed and reliability`
    : serverHosts.length > 1
    ? `This community's admins have added servers (${serverList}). At least one of these servers is not owned or operated by Quiet`
    : `This community's admins have added a server (${serverList}). This server is not owned or operated by Quiet`

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
            {isQuietServer ? (
              <ServerBoxIcon size={64} testID='quiet-server-icon' accessibilityLabel='Quiet server' />
            ) : (
              <Image
                source={icons.exclamationMark}
                resizeMode='contain'
                style={{ width: 64, height: 57 }}
                testID='non-quiet-server-warning-icon'
                accessibilityLabel='Warning'
              />
            )}
          </View>
          <Typography fontSize={28} fontWeight={'bold'} style={{ textAlign: 'center' }}>
            {isQuietServer
              ? 'This community is hosted on Quiet’s server'
              : 'This community uses a server not owned by Quiet'}
          </Typography>
          <Typography fontSize={14} style={{ marginBottom: 24, textAlign: 'center' }}>
            {serverDescription}. Quiet will connect to the server without Tor, so this comes at the cost of Tor's
            anonymity protection. Would you like to use the server or leave the community?
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
