import React, { type FC, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { communities, connection } from '@quiet/state-manager'

import { useModal } from '../../../../containers/hooks'
import { ModalName } from '../../../../sagas/modals/modals.types'
import { LinkDevicesComponent } from '../../../Onboarding/LinkDevicesComponent'
import type { LinkDevicesModalArgs, LinkDevicesStep } from '../../../Onboarding/LinkDevices'

/**
 * Settings → Linked devices: the in-app entry to the one Link devices stage (Device-linking
 * file, Entry points 879:19861 — the switcher's row opens the same screen Get started does).
 * The tab shows that screen's content with the community's device list; each row opens the
 * Link devices modal straight at its step, on top of Settings.
 */
export const LinkedDevices: FC = () => {
  const dispatch = useDispatch()
  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const linkedDevices = useSelector(connection.selectors.linkedDevices)
  const linkDevicesModal = useModal<LinkDevicesModalArgs>(ModalName.linkDevicesModal)
  const canMintLink = Boolean(currentCommunity)

  useEffect(() => {
    if (canMintLink) dispatch(connection.actions.getLinkedDevices())
  }, [dispatch, canMintLink])

  const openAt = (step: LinkDevicesStep) => () => linkDevicesModal.handleOpen({ step })

  return (
    <LinkDevicesComponent
      onDisplayQrCode={openAt('display')}
      onScanQrCode={openAt('scan')}
      onPasteLink={openAt('pasteLink')}
      canDisplayQrCode={canMintLink}
      linkedDevices={linkedDevices}
    />
  )
}
