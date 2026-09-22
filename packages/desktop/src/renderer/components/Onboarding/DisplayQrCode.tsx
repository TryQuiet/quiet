import React, { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { communities, connection } from '@quiet/state-manager'

import { DisplayQrCodeComponent } from './DisplayQrCodeComponent'

/**
 * Mints a device link when there is none to show (a link can only be minted from inside a
 * community) and again on Reset QR code. Used by Link devices → Display QR code and by
 * Settings → Linked devices.
 *
 * A device link is reusable until it expires, so opening this surface does not throw the current
 * one away — that would invalidate a link the user had already sent to their other device. An
 * unexpired invite is shown again; Reset QR code is the deliberate way to mint another.
 */
export const DisplayQrCode: React.FC<{ dataTestId?: string }> = ({ dataTestId }) => {
  const dispatch = useDispatch()
  const deviceLink = useSelector(connection.selectors.deviceLinkUrl)
  const deviceLinkInvite = useSelector(connection.selectors.deviceLinkInvite)
  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const canMintLink = Boolean(currentCommunity)

  const handledCurrentOpen = useRef(false)

  useEffect(() => {
    if (handledCurrentOpen.current || !canMintLink) return
    handledCurrentOpen.current = true
    if (!deviceLinkInvite || deviceLinkInvite.expiresAt <= Date.now()) {
      dispatch(connection.actions.createDeviceLink())
    }
  }, [deviceLinkInvite, canMintLink, dispatch])

  return (
    <DisplayQrCodeComponent
      deviceLink={deviceLink}
      isLoading={!deviceLinkInvite && canMintLink}
      onReset={() => {
        dispatch(connection.actions.setDeviceLinkInvite(undefined))
        dispatch(connection.actions.createDeviceLink())
      }}
      dataTestId={dataTestId}
    />
  )
}

export default DisplayQrCode
