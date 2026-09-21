import React, { type FC, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { connection } from '@quiet/state-manager'

import { LinkedDevicesComponent } from './LinkedDevices.component'

export const LinkedDevices: FC<{ centered?: boolean }> = ({ centered = false }) => {
  const dispatch = useDispatch()
  const deviceLink = useSelector(connection.selectors.deviceLinkUrl)
  const deviceLinkInvite = useSelector(connection.selectors.deviceLinkInvite)
  const deviceLinkCreationFailed = useSelector(connection.selectors.deviceLinkCreationFailed)
  const [revealLink, setRevealLink] = useState(false)
  const [requestPending, setRequestPending] = useState(!deviceLinkInvite || deviceLinkInvite.expiresAt <= Date.now())
  const didRequestOnMount = useRef(false)

  useEffect(() => {
    if (didRequestOnMount.current) return
    didRequestOnMount.current = true
    if (requestPending) {
      dispatch(connection.actions.createDeviceLink())
    }
  }, [dispatch, requestPending])

  useEffect(() => {
    if (deviceLinkInvite || deviceLinkCreationFailed) setRequestPending(false)
  }, [deviceLinkCreationFailed, deviceLinkInvite])

  return (
    <LinkedDevicesComponent
      deviceLink={deviceLink}
      isLoading={requestPending && !deviceLinkCreationFailed}
      revealLink={revealLink}
      onToggleLinkVisibility={() => setRevealLink(currentValue => !currentValue)}
      centered={centered}
    />
  )
}
