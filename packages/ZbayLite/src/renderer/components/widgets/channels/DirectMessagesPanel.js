import React from 'react'
import Grid from '@material-ui/core/Grid'

import ItemSizedChannelsList from './ItemSizedChannelsList'
import SidebarHeader from '../../ui/SidebarHeader'
import AddDirectMessage from '../../../containers/widgets/channels/AddDirectMessage'
import SpinnerLoader from '../../ui/SpinnerLoader'

export const DirectMessagesPanel = ({ isLoading, channels }) => {
  return (
    <Grid item container direction='column'>
      <SidebarHeader
        title='Direct Messages'
        actions={[<AddDirectMessage key='create-channel' />]}
      />
      {isLoading ? (
        <SpinnerLoader />
      ) : (
        <ItemSizedChannelsList channels={channels} directMessages itemsCount={4} displayAddress />
      )}
    </Grid>
  )
}

export default DirectMessagesPanel
