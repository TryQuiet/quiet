import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { publicChannels, users } from '@zbayapp/nectar'

import ChannelMessageComponent from '../../../components/widgets/channels/ChannelMessage'
import channelHandlers from '../../../store/handlers/channel'
import whitelistSelectors from '../../../store/selectors/whitelist'
import { ModalName } from '../../../sagas/modals/modals.types'
import whitelistHandlers from '../../../store/handlers/whitelist'
import { useModal } from '../../hooks'

export const useChannelMessageData = () => {
  const data = {
    publicChannels: useSelector(publicChannels.selectors.publicChannels),
    users: useSelector(users.selectors.certificatesMapping),
    allowAll: useSelector(whitelistSelectors.allowAll),
    whitelisted: useSelector(whitelistSelectors.whitelisted),
    autoload: useSelector(whitelistSelectors.autoload)

  }
  return data
}

const ChannelMessage = ({ message }) => {
  const dispatch = useDispatch()
  const { publicChannels, users, allowAll, whitelisted, autoload } = useChannelMessageData()

  const onLinkedChannel = useCallback(
    (channel: string) => {
      dispatch(channelHandlers.epics.linkChannelRedirect(channel))
    },
    [dispatch]
  )
  const addToWhitelist = useCallback(
    (url, dontAutoload) => {
      dispatch(whitelistHandlers.epics.addToWhitelist(url, dontAutoload))
    },
    [dispatch]
  )

  const setWhitelistAll = useCallback(() => {
    dispatch(whitelistHandlers.epics.setWhitelistAll)
  }, [dispatch])

  const openExternalLink = useModal(ModalName.openexternallink)

  return (
    <ChannelMessageComponent
      publicChannels={publicChannels}
      users={users}
      allowAll={allowAll}
      whitelisted={whitelisted}
      autoload={autoload}
      onLinkedChannel={onLinkedChannel}
      addToWhitelist={addToWhitelist}
      setWhitelistAll={setWhitelistAll}
      openExternalLink={openExternalLink.handleOpen}
      message={message}
      onLinkedUser={openExternalLink.handleOpen}
    />
  )
}

export default ChannelMessage
