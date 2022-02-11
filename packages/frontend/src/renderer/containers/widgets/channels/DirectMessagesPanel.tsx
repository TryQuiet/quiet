import React from 'react'

import Grid from '@material-ui/core/Grid'
import SidebarHeader from '../../../components/ui/Sidebar/SidebarHeader'
import QuickActionButton from '../../../components/widgets/sidebar/QuickActionButton'

import { useModal } from '../../hooks'
import { ModalName } from '../../../sagas/modals/modals.types'

export const useDirectMessagesPanelData = () => {
  const data = {
    channels: []
  }
  return data
}

export const DirectMessagesPanel = ({ title }) => {
  const modal = useModal(ModalName.newMessageSeparate)
  const { channels } = useDirectMessagesPanelData()

  return (
    <Grid container item xs direction='column'>
      <Grid item>
        <SidebarHeader title={title} action={modal.handleOpen} tooltipText='Create new message' />
      </Grid>
      <Grid item>
        {/* <BaseChannelsList channels={channels} /> */}
      </Grid>
      <Grid item>
        <QuickActionButton text='New Message' action={modal.handleOpen} />
      </Grid>
    </Grid>
  )
}

export default DirectMessagesPanel
