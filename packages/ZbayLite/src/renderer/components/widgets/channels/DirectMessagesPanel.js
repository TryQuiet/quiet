import React from 'react'

import Grid from '@material-ui/core/Grid'

import ItemSizedChannelsList from './ItemSizedChannelsList'
import SidebarHeader from '../../ui/SidebarHeader'
import CreateChannelModal from '../CreateChannelModal'

export const DirectMessagesPanel = ({ channels }) => (
  <Grid item container direction='column'>
    <SidebarHeader
      title='Direct Messages'
      actions={[
        <CreateChannelModal key='create-channel' />
      ]}
    />
    <ItemSizedChannelsList channels={channels} itemsCount={4} displayAddress />
  </Grid>
)

export default React.memo(DirectMessagesPanel)
