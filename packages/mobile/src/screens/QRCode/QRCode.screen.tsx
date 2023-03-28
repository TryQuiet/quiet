import React, { FC, useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Share } from 'react-native'
import { communities } from '@quiet/state-manager'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'

import { QRCode } from '../../components/QRCode/QRCode.component'

export const QRCodeScreen: FC = () => {
  const dispatch = useDispatch()

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
    try {
      await Share.share({
        message: `https://tryquiet.org/join?code=${community?.registrarUrl}`
      })
    } catch (error) {
      console.error(error)
    }
  }

  const svgRef = useRef()
  console.log(svgRef.current)

  return <QRCode value={invitationLink} svgRef={svgRef} shareCode={shareCode} handleBackButton={handleBackButton} />
}
