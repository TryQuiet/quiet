import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as R from 'ramda'

import RescanMessage from '../../../components/widgets/channels/RescanMessage'
import appHandlers from '../../../store/handlers/app'

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      onClick: appHandlers.epics.restartAndRescan
    },
    dispatch
  )

export default R.compose(
  React.memo,
  connect(
    null,
    mapDispatchToProps
  )
)(RescanMessage)
