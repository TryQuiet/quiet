import React from 'react'
import { connect } from 'react-redux'
import Immutable from 'immutable'

import Grid from '@material-ui/core/Grid'
import DirectMessagesPanelComponent from '../../../components/widgets/channels/DirectMessagesPanel'
import contactsSelectors from '../../../store/selectors/contacts'
import directMessageSelectors from '../../../store/selectors/directMessageChannel'
import SidebarHeader from '../../../components/ui/SidebarHeader'
import AddDirectMessage from './AddDirectMessage'

export const mapStateToProps = state => ({
  channels: contactsSelectors.contacts(state).toList(),
  selected: directMessageSelectors.directMessageChannel(state)
})

export const DirectMessagesPanel = ({ channels, selected }) => {
  return (
    <Grid item container direction='column'>
      <SidebarHeader
        title='Direct Messages'
        actions={[<AddDirectMessage key='create-channel' />]}
      />
      <DirectMessagesPanelComponent channels={channels} selected={selected} />
    </Grid>
  )
}

export default connect(mapStateToProps)(
  React.memo(DirectMessagesPanel, (before, after) => {
    return (
      Immutable.is(before.channels, after.channels) && Immutable.is(before.selected, after.selected)
    )
  })
)
