import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as R from 'ramda'
import Grid from '@material-ui/core/Grid'
import DirectMessagesPanelComponent from '../../../components/widgets/channels/DirectMessagesPanel'
import contactsSelectors from '../../../store/selectors/contacts'
import directMessageSelectors from '../../../store/selectors/directMessageChannel'
import contactsHandlers from '../../../store/handlers/contacts'
import SidebarHeader from '../../../components/ui/SidebarHeader'
import AddDirectMessage from './AddDirectMessage'
import { useInterval } from '../../hooks'

export const mapStateToProps = state => ({
  channels: contactsSelectors.contacts(state).toList(),
  selected: directMessageSelectors.directMessageChannel(state)
})

export const mapDispatchToProps = dispatch => {
  return bindActionCreators(
    {
      fetchMessages: contactsHandlers.epics.fetchMessages
    },
    dispatch
  )
}

export const DirectMessagesPanel = ({ channels, fetchMessages, selected }) => {
  useInterval(fetchMessages, 15000)
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

export default R.compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  ),
  React.memo
)(DirectMessagesPanel)
