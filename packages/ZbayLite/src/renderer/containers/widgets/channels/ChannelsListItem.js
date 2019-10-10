import React from 'react'
import { withRouter } from 'react-router-dom'
import * as R from 'ramda'

import ChannelsListItem from '../../../components/widgets/channels/ChannelsListItem'

export default R.compose(
  React.memo,
  withRouter
)(ChannelsListItem)
