import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as R from 'ramda'

import AddDirectMessage from '../../../components/widgets/channels/AddDirectMessage'
import { actionCreators } from '../../../store/handlers/modals'

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      openModal: actionCreators.openModal('sendMoney')
    },
    dispatch
  )

export default R.compose(
  React.memo,
  connect(
    null,
    mapDispatchToProps
  )
)(AddDirectMessage)
