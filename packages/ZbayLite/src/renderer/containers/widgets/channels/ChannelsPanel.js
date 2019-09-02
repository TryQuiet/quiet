import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as R from 'ramda'
import Grid from '@material-ui/core/Grid'
import RootRef from '@material-ui/core/RootRef'
import { withContentRect } from 'react-measure'

import ChannelsPanelComponent from '../../../components/widgets/channels/ChannelsPanel'
import SidebarHeader from '../../../components/ui/SidebarHeader'
import AddChannelAction from './AddChannelAction'
import channelsSelectors from '../../../store/selectors/channels'
import identitySelectors from '../../../store/selectors/identity'
import messagesHandlers from '../../../store/handlers/messages'
import { useInterval } from '../../hooks'

export const mapStateToProps = state => ({
  channels: channelsSelectors.data(state),
  loader: identitySelectors.loader(state)
})

export const mapDispatchToProps = dispatch => {
  return bindActionCreators(
    {
      fetchChannelsMessages: messagesHandlers.epics.fetchMessages
    },
    dispatch
  )
}

export const ChannelsPanel = ({ fetchChannelsMessages, measureRef, ...props }) => {
  useInterval(fetchChannelsMessages, 15000)
  return (
    <RootRef rootRef={measureRef}>
      <Grid container item xs direction='column'>
        <SidebarHeader title='Channels' actions={[<AddChannelAction key='create-channel' />]} />
        <ChannelsPanelComponent {...props} />
      </Grid>
    </RootRef>
  )
}

export default R.compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  ),
  withContentRect('bounds'),
  React.memo
)(ChannelsPanel)
