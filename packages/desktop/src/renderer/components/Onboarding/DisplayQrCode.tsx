import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { communities, connection } from '@quiet/state-manager'

import { DisplayQrCodeComponent } from './DisplayQrCodeComponent'

/**
 * Mints a device link when shown (a link can only be minted from inside a community) and
 * again on Reset QR code. Used by Link devices → Display QR code and by Settings → Linked devices.
 */
export const DisplayQrCode: React.FC<{ dataTestId?: string }> = ({ dataTestId }) => {
  const dispatch = useDispatch()
  const deviceLink = useSelector(connection.selectors.deviceLinkUrl)
  const deviceLinkInvite = useSelector(connection.selectors.deviceLinkInvite)
  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const canMintLink = Boolean(currentCommunity)

  // A fresh one-time link every time the surface opens.
  useEffect(() => {
    dispatch(connection.actions.setDeviceLinkInvite(undefined))
  }, [dispatch])

  useEffect(() => {
    if (!deviceLinkInvite && canMintLink) dispatch(connection.actions.createDeviceLink())
  }, [deviceLinkInvite, canMintLink, dispatch])

  return (
    <DisplayQrCodeComponent
      deviceLink={deviceLink}
      isLoading={!deviceLinkInvite && canMintLink}
      onReset={() => dispatch(connection.actions.setDeviceLinkInvite(undefined))}
      dataTestId={dataTestId}
    />
  )
}

export default DisplayQrCode
