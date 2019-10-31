import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { withModal, actionCreators } from '../../../store/handlers/modals'
import AdvertActionsComponent from '../../../components/ui/adverts/AdvertActionModal'
import modalsSelectors from '../../../store/selectors/modals'

export const mapStateToProps = state => ({
  payload: modalsSelectors.payload('advertActions')(state)
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      onSendFoundsAction: (modalName, payload) => actionCreators.openModal(modalName, payload)()
    },
    dispatch
  )

export const AdvertActionsModal = props => {
  return <AdvertActionsComponent {...props} />
}

export default R.compose(
  React.memo,
  connect(
    mapStateToProps,
    mapDispatchToProps
  ),
  withModal('advertActions')
)(AdvertActionsModal)
