import React, { type FC, useCallback, useEffect, useRef } from 'react'
import { View } from 'react-native'
import Share from 'react-native-share'
import SVG from 'react-native-svg'
import { useDispatch, useSelector } from 'react-redux'

import { connection } from '@quiet/state-manager'

import { Appbar } from '../../components/Appbar/Appbar.component'
import { Loading } from '../../components/Loading/Loading.component'
import { QRCode } from '../../components/QRCode/QRCode.component'
import { Typography } from '../../components/Typography/Typography.component'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { createLogger } from '../../utils/logger'

const logger = createLogger('linkedDeviceQrCode:screen')

export const LinkedDeviceQRCodeScreen: FC = () => {
  const dispatch = useDispatch()
  const svgRef = useRef<SVG>()
  const deviceLink = useSelector(connection.selectors.deviceLinkUrl)
  const deviceLinkInvite = useSelector(connection.selectors.deviceLinkInvite)
  const deviceLinkCreationFailed = useSelector(connection.selectors.deviceLinkCreationFailed)

  useEffect(() => {
    if (!deviceLinkInvite) {
      dispatch(connection.actions.createDeviceLink())
    }
  }, [deviceLinkInvite, dispatch])

  const handleBackButton = useCallback(() => {
    dispatch(navigationActions.pop())
  }, [dispatch])

  const shareCode = async () => {
    if (!deviceLink) return

    svgRef.current?.toDataURL(async base64 => {
      try {
        await Share.open({
          title: 'Quiet device link',
          message: `Link this device to my Quiet community:\n${deviceLink}`,
          url: `data:image/png;base64,${base64}`,
        })
      } catch (error) {
        logger.error(error)
      }
    })
  }

  if (!deviceLink) {
    return (
      <View style={{ flex: 1 }}>
        <Appbar title='Link a device' back={handleBackButton} />
        {deviceLinkCreationFailed ? (
          <View style={{ padding: 24 }}>
            <Typography fontSize={14} horizontalTextAlign='center'>
              Could not generate a device link. Go back and try again.
            </Typography>
          </View>
        ) : (
          <Loading
            title='Generating device link'
            caption='Keep this device online while Quiet prepares the one-time code.'
          />
        )}
      </View>
    )
  }

  return (
    <QRCode
      value={deviceLink}
      svgRef={svgRef}
      shareCode={shareCode}
      handleBackButton={handleBackButton}
      title='Link a device'
      description='Scan this private, one-time code with Quiet on a device you control. Keep both devices online until linking finishes. The code expires after 30 minutes.'
    />
  )
}
