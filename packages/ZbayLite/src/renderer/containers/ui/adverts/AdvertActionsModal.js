import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { withRouter } from 'react-router-dom'

import { withModal, actionCreators } from '../../../store/handlers/modals'
import AdvertActionsComponent from '../../../components/ui/adverts/AdvertActionModal'
import modalsSelectors from '../../../store/selectors/modals'
import offersHandlers from '../../../store/handlers/offers'
import whitelistSelectors from '../../../store/selectors/whitelist'

export const mapStateToProps = state => ({
  payload: modalsSelectors.payload('advertActions')(state),
  allowAll: whitelistSelectors.allowAll(state),
  whitelisted: whitelistSelectors.whitelisted(state)
})

export const mapDispatchToProps = (dispatch, { payload }) => {
  return bindActionCreators(
    {
      onSendFoundsAction: (modalName, payload) =>
        actionCreators.openModal(modalName, payload)(),
      handleMessage: offersHandlers.epics.createOfferAdvert,
      openExternalLink: payload =>
        actionCreators.openModal('openexternallink', payload)()
    },
    dispatch
  )
}

export const AdvertActionsModal = props => {
  return <AdvertActionsComponent {...props} />
}
export default R.compose(
  React.memo,
  connect(mapStateToProps, mapDispatchToProps),
  withModal('advertActions'),
  withRouter
)(AdvertActionsModal)
