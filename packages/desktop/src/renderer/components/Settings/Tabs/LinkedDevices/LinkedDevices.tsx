import React, { type FC, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { communities, connection } from '@quiet/state-manager'

import { useModal } from '../../../../containers/hooks'
import { ModalName } from '../../../../sagas/modals/modals.types'
import { ConfirmationToast } from '../../../ui/ConfirmationToast/ConfirmationToast'
import { LinkDevicesComponent } from '../../../Onboarding/LinkDevicesComponent'
import { useCopyDeviceLink } from '../../../Onboarding/useCopyDeviceLink'
import type { LinkDevicesModalArgs } from '../../../Onboarding/LinkDevices'

/**
 * Settings → Linked devices: the in-app entry to the one Link devices stage (Device-linking
 * file, Entry points 879:19861 — the switcher's row opens the same screen Get started does).
 * Inside a community this device shares: Display QR code opens the Link devices modal
 * straight at the QR sheet, on top of Settings; Copy link copies the same one-time link
 * and confirms with the design's toast.
 */
export const LinkedDevices: FC = () => {
  const dispatch = useDispatch()
  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const linkedDevices = useSelector(connection.selectors.linkedDevices)
  const linkDevicesModal = useModal<LinkDevicesModalArgs>(ModalName.linkDevicesModal)
  const inCommunity = Boolean(currentCommunity)
  const copyLink = useCopyDeviceLink(inCommunity)

  useEffect(() => {
    if (inCommunity) dispatch(connection.actions.getLinkedDevices())
  }, [dispatch, inCommunity])

  return (
    <>
      <LinkDevicesComponent
        direction={inCommunity ? 'share' : 'receive'}
        onDisplayQrCode={() => linkDevicesModal.handleOpen({ step: 'display' })}
        deviceLink={copyLink.deviceLink}
        onCopyLink={copyLink.onCopyLink}
        onLinkCopied={copyLink.onLinkCopied}
        onScanQrCode={() => linkDevicesModal.handleOpen({ step: 'scan' })}
        onPasteLink={() => linkDevicesModal.handleOpen({ step: 'pasteLink' })}
        linkedDevices={linkedDevices}
      />
      <ConfirmationToast open={copyLink.copied} message={'Copied'} onClose={copyLink.dismissCopied} />
    </>
  )
}
