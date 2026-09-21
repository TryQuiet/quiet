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
  const svgRef = useRef<SVG | undefined>(undefined)
  const handledCurrentOpen = useRef(false)
  const showedLinkCurrentOpen = useRef(false)
  const deviceLink = useSelector(connection.selectors.deviceLinkUrl)
  const deviceLinkInvite = useSelector(connection.selectors.deviceLinkInvite)
  const deviceLinkCreationFailed = useSelector(connection.selectors.deviceLinkCreationFailed)
  if (deviceLink) showedLinkCurrentOpen.current = true

  useEffect(() => {
    if (handledCurrentOpen.current) return
    handledCurrentOpen.current = true
    if (!deviceLinkInvite || deviceLinkInvite.expiresAt <= Date.now()) {
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
        {deviceLinkCreationFailed || showedLinkCurrentOpen.current ? (
          <View style={{ padding: 24 }}>
            <Typography fontSize={14} horizontalTextAlign='center'>
              {deviceLinkCreationFailed
                ? 'Could not generate a device link. Go back and try again.'
                : 'This device link expired. Go back and open Link a device again to generate another.'}
            </Typography>
          </View>
        ) : (
          <Loading
            title='Generating device link'
            caption='Keep this device online while Quiet prepares the private code.'
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
      description='Anyone with this private code can link another device until it expires in 30 minutes. Keep it secret, and keep both devices online while linking. Expiry blocks new linking but does not remove keys already received by a linked device.'
    />
  )
}
