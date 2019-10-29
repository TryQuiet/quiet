import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'

import { withModal } from '../../../store/handlers/modals'
import AdvertActionsComponent from '../../../components/ui/adverts/AdvertActionModal'
import modalsSelectors from '../../../store/selectors/modals'

export const mapStateToProps = state => ({
  payload: modalsSelectors.payload('advertActions')(state)
})

export const AdvertActionsModal = props => {
  return <AdvertActionsComponent {...props} />
}

export default R.compose(
  React.memo,
  connect(
    mapStateToProps,
    null
  ),
  withModal('advertActions')
)(AdvertActionsModal)
