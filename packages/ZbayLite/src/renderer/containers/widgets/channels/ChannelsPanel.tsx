import React from 'react'
import { useSelector } from 'react-redux'
import Grid from '@material-ui/core/Grid'
import { publicChannels, PublicChannel } from '@zbayapp/nectar'

import BaseChannelsList from '../../../components/widgets/channels/BaseChannelsList'
import SidebarHeader from '../../../components/ui/Sidebar/SidebarHeader'
import QuickActionButton from '../../../components/widgets/sidebar/QuickActionButton'
import { Icon } from '../../../components/ui/Icon/Icon'
import SearchIcon from '../../../static/images/st-search.svg'
import { useModal } from '../../hooks'
import { ModalName } from '../../../sagas/modals/modals.types'

interface useChannelPanelDataReturnTypes {
  channels: PublicChannel[]
  selected: string
}

const useChannelsPanelData = (): useChannelPanelDataReturnTypes => {
  const data = {
    channels: useSelector(publicChannels.selectors.publicChannels),
    selected: useSelector(publicChannels.selectors.currentChannel)
  }
  return data
}

export const ChannelsPanel = ({
  title
}) => {
  const data = useChannelsPanelData()

  const joinChannelModal = useModal(ModalName.joinChannel)
  const createChannelModal = useModal(ModalName.createChannel)

  return (
    <Grid container item xs direction='column'>
      <Grid item>
        <SidebarHeader
          title={title}
          action={createChannelModal.handleOpen}
          tooltipText='Create new channel'
          actionTitle={joinChannelModal.handleOpen}
        />
      </Grid>
      <Grid item>
        <BaseChannelsList
          channels={data.channels}
          selected={data.selected}
        />
      </Grid>
      <Grid item>
        <QuickActionButton
          text='Find Channel'
          action={joinChannelModal.handleOpen}
          icon={<Icon src={SearchIcon} />}
        />
      </Grid>
    </Grid>
  )
}
export default ChannelsPanel
