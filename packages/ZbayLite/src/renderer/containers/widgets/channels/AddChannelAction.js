import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as R from 'ramda'

import AddChannelAction from '../../../components/widgets/channels/AddChannelAction'
import { actionCreators } from '../../../store/handlers/modals'

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      openCreateModal: actionCreators.openModal('createChannel')
    },
    dispatch
  )

export default R.compose(
  React.memo,
  connect(
    null,
    mapDispatchToProps
  )
)(AddChannelAction)
