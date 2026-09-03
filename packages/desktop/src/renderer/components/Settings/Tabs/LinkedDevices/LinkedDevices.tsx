import React, { type FC, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { connection } from '@quiet/state-manager'

import { LinkedDevicesComponent } from './LinkedDevices.component'

export const LinkedDevices: FC = () => {
  const dispatch = useDispatch()
  const deviceLink = useSelector(connection.selectors.deviceLinkUrl)
  const deviceLinkInvite = useSelector(connection.selectors.deviceLinkInvite)
  const [revealLink, setRevealLink] = useState(false)

  useEffect(() => {
    dispatch(connection.actions.setDeviceLinkInvite(undefined))
  }, [dispatch])

  useEffect(() => {
    if (!deviceLinkInvite) {
      dispatch(connection.actions.createDeviceLink())
    }
  }, [deviceLinkInvite, dispatch])

  return (
    <LinkedDevicesComponent
      deviceLink={deviceLink}
      isLoading={!deviceLinkInvite}
      revealLink={revealLink}
      onToggleLinkVisibility={() => setRevealLink(currentValue => !currentValue)}
    />
  )
}
