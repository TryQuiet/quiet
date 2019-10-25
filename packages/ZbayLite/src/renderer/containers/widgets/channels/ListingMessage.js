import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import ListingMessage from '../../../components/widgets/channels/ListingMessage'
import { actionCreators } from '../../../store/handlers/modals'

export const mapDispatchToProps = (dispatch, ownProps) =>
  bindActionCreators(
    {
      buyActions: (modalName, payload) => actionCreators.openModal(modalName, payload)()
    },
    dispatch
  )

export default R.compose(
  React.memo,
  connect(
    null,
    mapDispatchToProps
  )
)(ListingMessage)
