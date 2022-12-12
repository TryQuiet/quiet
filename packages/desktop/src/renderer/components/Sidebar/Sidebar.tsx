import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useModal } from '../../containers/hooks'
import { ModalName } from '../../sagas/modals/modals.types'
import { communities, publicChannels } from '@quiet/state-manager'
import SidebarComponent from './SidebarComponent'
import { ChannelsPanelProps } from './ChannelsPanel/ChannelsPanel'
import { IdentityPanelProps } from './IdentityPanel/IdentityPanel'

const Sidebar = () => {
  const dispatch = useDispatch()

  const createChannelModal = useModal(ModalName.createChannel)
  const accountSettingsModal = useModal(ModalName.accountSettingsModal)

  const channels = useSelector(publicChannels.selectors.publicChannels)
  const unreadChannels = useSelector(publicChannels.selectors.unreadChannels)

  const currentCommunity = useSelector(communities.selectors.currentCommunity)

  const currentChannel = useSelector(publicChannels.selectors.currentChannelAddress)

  const setCurrentChannel = (address: string) => {
    dispatch(
      publicChannels.actions.setCurrentChannel({
        channelAddress: address
      })
    )
  }

  const identityPanelProps: IdentityPanelProps = {
    currentCommunity: currentCommunity,
    accountSettingsModal: accountSettingsModal
  }

  const channelsPanelProps: ChannelsPanelProps = {
    channels: channels,
    unreadChannels: unreadChannels,
    setCurrentChannel: setCurrentChannel,
    currentChannel: currentChannel,
    createChannelModal: createChannelModal
  }

  return <SidebarComponent {...identityPanelProps} {...channelsPanelProps} />
}

export default Sidebar
