import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { connection } from '@quiet/state-manager'

/**
 * The Copy link row's link: the same one-time device link the QR sheet shows, minted as
 * soon as the share direction is on screen so the row copies on the first click; a click
 * before it exists just asks for it. `copied` drives the "Copied" toast.
 */
export const useCopyDeviceLink = (enabled: boolean) => {
  const dispatch = useDispatch()
  const deviceLink = useSelector(connection.selectors.deviceLinkUrl)
  const deviceLinkInvite = useSelector(connection.selectors.deviceLinkInvite)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (enabled && !deviceLinkInvite) dispatch(connection.actions.createDeviceLink())
  }, [enabled, deviceLinkInvite, dispatch])

  return {
    deviceLink: enabled ? deviceLink : '',
    copied,
    onCopyLink: () => dispatch(connection.actions.createDeviceLink()),
    onLinkCopied: () => setCopied(true),
    dismissCopied: () => setCopied(false),
  }
}
