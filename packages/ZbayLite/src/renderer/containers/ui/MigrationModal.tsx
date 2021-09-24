import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as R from 'ramda'

import MigrationModalComponent from '../../components/ui/MigrationModal/MigrationModal'
import { withModal } from '../../store/handlers/modals'

export const mapStateToProps = _state => ({})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {},

    dispatch
  )

export default R.compose(
  React.memo,
  connect(mapStateToProps, mapDispatchToProps),
  withModal('migrationModal')
)(MigrationModalComponent)
