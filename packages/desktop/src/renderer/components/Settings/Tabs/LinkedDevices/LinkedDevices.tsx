import React, { type FC, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { communities, connection } from '@quiet/state-manager'

import { LinkedDevicesComponent } from './LinkedDevices.component'

export const LinkedDevices: FC = () => {
  const dispatch = useDispatch()
  const deviceLink = useSelector(connection.selectors.deviceLinkUrl)
  const deviceLinkInvite = useSelector(connection.selectors.deviceLinkInvite)
  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const canMintLink = Boolean(currentCommunity)
  const [revealLink, setRevealLink] = useState(false)

  useEffect(() => {
    dispatch(connection.actions.setDeviceLinkInvite(undefined))
  }, [dispatch])

  useEffect(() => {
    if (!deviceLinkInvite && canMintLink) {
      dispatch(connection.actions.createDeviceLink())
    }
  }, [deviceLinkInvite, canMintLink, dispatch])

  return (
    <LinkedDevicesComponent
      deviceLink={deviceLink}
      isLoading={!deviceLinkInvite && canMintLink}
      revealLink={revealLink}
      onToggleLinkVisibility={() => setRevealLink(currentValue => !currentValue)}
    />
  )
}
