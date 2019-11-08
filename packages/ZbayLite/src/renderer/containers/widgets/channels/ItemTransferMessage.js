import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'

import ItemTransferMessageComponent from '../../../components/widgets/channels/ItemTransferMessage'
import ratesSelectors from '../../../store/selectors/rates'

const mapStateToProps = (state) => ({
  rateUsd: ratesSelectors.rate('usd')(state)
})

export default R.compose(
  React.memo,
  connect(
    mapStateToProps,
    null
  )
)(ItemTransferMessageComponent)
