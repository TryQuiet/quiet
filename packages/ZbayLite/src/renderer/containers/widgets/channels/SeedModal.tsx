import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'

import { bindActionCreators } from 'redux'

import { withModal } from '../../../store/handlers/modals'
import SeedModalComponent from '../../../components/widgets/channels/SeedModal'
export const mapStateToProps = _state => ({})
export const mapDispatchToProps = (dispatch) =>
  bindActionCreators({}, dispatch)

export const SeedModal = ({ ...props }) => {
  return <SeedModalComponent {...props} />
}
export default R.compose(
  connect(mapStateToProps, mapDispatchToProps),
  React.memo,
  withModal('seedModal')
)(SeedModal)
