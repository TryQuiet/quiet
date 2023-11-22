import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useModal } from '../../containers/hooks'
import { ModalName } from '../../sagas/modals/modals.types'
import { communities, connection, publicChannels } from '@quiet/state-manager'
import SidebarComponent from './SidebarComponent'
import { ChannelsPanelProps } from './ChannelsPanel/ChannelsPanel'
import { IdentityPanelProps } from './IdentityPanel/IdentityPanel'

const Sidebar = () => {
    const dispatch = useDispatch()

    const createChannelModal = useModal(ModalName.createChannel)
    const accountSettingsModal = useModal(ModalName.accountSettingsModal)

    const unreadChannels = useSelector(publicChannels.selectors.unreadChannels)

    const currentCommunity = useSelector(communities.selectors.currentCommunity)

    const currentChannelId = useSelector(publicChannels.selectors.currentChannelId)

    // Workaround for Redux bug, issue: https://github.com/TryQuiet/quiet/issues/1332
    useSelector(publicChannels.selectors.sortedChannels)
    const publicChannelsSelector = useSelector(publicChannels.selectors.publicChannels)
    const isTorInitialized = useSelector(connection.selectors.isTorInitialized)

    const setCurrentChannel = (id: string) => {
        dispatch(
            publicChannels.actions.setCurrentChannel({
                channelId: id,
            })
        )
    }

    if (!currentCommunity || !currentChannelId) {
        return null
    }

    const identityPanelProps: IdentityPanelProps = {
        currentCommunity: currentCommunity,
        accountSettingsModal: accountSettingsModal,
    }

    const channelsPanelProps: ChannelsPanelProps = {
        channels: publicChannelsSelector,
        unreadChannels: unreadChannels,
        setCurrentChannel: setCurrentChannel,
        currentChannelId: currentChannelId,
        createChannelModal: createChannelModal,
    }

    return <SidebarComponent {...identityPanelProps} {...channelsPanelProps} isTorInitialized={isTorInitialized} />
}

export default Sidebar
