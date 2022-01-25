import React, { useState } from 'react'
import { bindActionCreators } from 'redux'
import { useDispatch, useSelector } from 'react-redux'

import ChannelSettingsModalComponent from '../../../components/widgets/channelSettings/ChannelSettingsModal'
import { useModal } from '../../hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
import { actions } from '../../../store/handlers/app'
import channelSelectors from '../../../store/selectors/channel'
import appSelectors from '../../../store/selectors/app'
import contactsSelectors from '../../../store/selectors/contacts'

const ChannelSettingsModal = () => {
  const [currentTab, setCurrentTab] = useState<'channelInfo' | 'moderators' | 'notifications'>(
    'channelInfo'
  )
  const modal = useModal(ModalName.channelSettingsModal)
  const address = useSelector(channelSelectors.channel)
  const channel = useSelector(contactsSelectors.contact(address))
  const modalTabToOpen = useSelector(appSelectors.currentModalTab)

  const dispatch = useDispatch()
  const { clearCurrentOpenTab } = bindActionCreators(
    {
      clearCurrentOpenTab: actions.clearModalTab
    },
    dispatch
  )

  return (
    <ChannelSettingsModalComponent
      {...modal}
      modalTabToOpen={modalTabToOpen}
      isOwner={false}
      channel={channel}
      clearCurrentOpenTab={clearCurrentOpenTab}
      setCurrentTab={setCurrentTab}
      currentTab={currentTab}
    />
  )
}

export default ChannelSettingsModal
