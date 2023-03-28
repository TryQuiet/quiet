import React, { FC, useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Share from 'react-native-share'
import SVG from 'react-native-svg'
import { communities } from '@quiet/state-manager'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'

import { QRCode } from '../../components/QRCode/QRCode.component'

export const QRCodeScreen: FC = () => {
  const dispatch = useDispatch()

  const svgRef = useRef<SVG>()

  const community = useSelector(communities.selectors.currentCommunity)
  const invitationLink = community?.registrarUrl || 'https://tryquiet.org/'

  const handleBackButton = useCallback(() => {
    dispatch(
      navigationActions.navigation({
        screen: ScreenNames.ChannelListScreen
      })
    )
  }, [dispatch])

  const shareCode = async () => {
    svgRef.current?.toDataURL(async (base64) => {
      try {
        await Share.open({
          title: '"Quiet" invitation',
          message: `Chat with me on "Quiet"!\nhttps://tryquiet.org/join?code=${community?.registrarUrl}`,
          url: `data:image/png;base64,${base64}`
        })
      } catch (error) {
        console.error(error)
      }
    })
  }

  return (
    <QRCode
      value={invitationLink}
      svgRef={svgRef}
      shareCode={shareCode}
      handleBackButton={handleBackButton}
    />
  )
}
