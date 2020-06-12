import React from 'react'
import { withRouter } from 'react-router-dom'
import * as R from 'ramda'
import { connect } from 'react-redux'
import usersSelectors from '../../../store/selectors/users'

import ChannelsListItem from '../../../components/widgets/channels/ChannelsListItem'

export const mapStateToProps = (state, { channel }) => {
  return {
    isRegisteredUsername: usersSelectors.isRegisteredUsername(channel.get('username'))(state)
  }
}

export default R.compose(
  React.memo,
  connect(mapStateToProps, null),
  withRouter
)(ChannelsListItem)
