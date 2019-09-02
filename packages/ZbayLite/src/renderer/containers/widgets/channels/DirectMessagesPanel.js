import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as R from 'ramda'
import Grid from '@material-ui/core/Grid'
import DirectMessagesPanelComponent from '../../../components/widgets/channels/DirectMessagesPanel'
import identitySelectors from '../../../store/selectors/identity'
import contactsSelectors from '../../../store/selectors/contacts'
import contactsHandlers from '../../../store/handlers/contacts'
import SidebarHeader from '../../../components/ui/SidebarHeader'
import AddDirectMessage from './AddDirectMessage'
import { useInterval } from '../../hooks'

export const mapStateToProps = state => ({
  channels: contactsSelectors.contacts(state).toList(),
  loader: identitySelectors.loader(state)
})

export const mapDispatchToProps = dispatch => {
  return bindActionCreators(
    {
      fetchMessages: contactsHandlers.epics.fetchMessages
    },
    dispatch
  )
}

export const DirectMessagesPanel = ({ channels, loader, fetchMessages }) => {
  useInterval(fetchMessages, 15000)

  return (
    <Grid item container direction='column'>
      <SidebarHeader
        title='Direct Messages'
        actions={[<AddDirectMessage key='create-channel' />]}
      />
      <DirectMessagesPanelComponent loader={loader} channels={channels} />
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
