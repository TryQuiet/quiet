import React from 'react'
import { withRouter } from 'react-router-dom'
import * as R from 'ramda'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import usersSelectors from '../../../store/selectors/users'
import channelSelectors from '../../../store/selectors/channel'
import { publicChannelsActions } from '../../../sagas/publicChannels/publicChannels.reducer'

import ChannelsListItem from '../../../components/widgets/channels/ChannelsListItem'

export const mapStateToProps = (state, { channel }) => {
  return {
    isRegisteredUsername: usersSelectors.isRegisteredUsername(channel.username)(state),
    isPublicChannel: channelSelectors.isPublicChannel(state)
  }
}

export const mapDispatchToProps = (dispatch) => bindActionCreators({
  fetchAllMessages: publicChannelsActions.loadAllMessages
}, dispatch)

export default R.compose(
  React.memo,
  connect(mapStateToProps, mapDispatchToProps),
  withRouter
)(ChannelsListItem)
