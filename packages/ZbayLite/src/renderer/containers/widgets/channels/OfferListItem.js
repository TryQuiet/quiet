import React from 'react'
import { withRouter } from 'react-router-dom'
import * as R from 'ramda'

import OfferListItem from '../../../components/widgets/channels/OfferListItem'

export default R.compose(
  React.memo,
  withRouter
)(OfferListItem)
