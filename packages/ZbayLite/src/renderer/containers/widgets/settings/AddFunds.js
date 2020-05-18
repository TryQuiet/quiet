import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'
import { bindActionCreators } from 'redux'

import identityHandlers from '../../../store/handlers/identity'
import AddFunds from '../../../components/widgets/settings/AddFunds'
import identitySelectors from '../../../store/selectors/identity'
import userSelectors from '../../../store/selectors/users'
import { actions } from '../../../store/handlers/app'

export const mapStateToProps = state => ({
  users: userSelectors.users(state),
  donationAddress: identitySelectors.donationAddress(state),
  donationAllow: identitySelectors.donationAllow(state),
  topAddress: identitySelectors.topAddress(state),
  topShieldedAddress: identitySelectors.topShieldedAddress(state)
})

export const mapDispatchToProps = (dispatch, props) =>
  bindActionCreators(
    {
      updateDonation: identityHandlers.epics.updateDonation,
      setDonationAddress: identityHandlers.actions.setDonationAddress,
      setDonationAllow: identityHandlers.actions.setDonationAllow,
      generateNewAddress: identityHandlers.epics.generateNewAddress,
      generateNewShieldedAddress:
        identityHandlers.epics.generateNewShieldedAddress,
      updateDonationAddress: address =>
        identityHandlers.epics.updateDonationAddress(address),
      clearCurrentOpenTab: actions.clearModalTab
    },
    dispatch
  )

export const TopUpModal = props => {
  return <AddFunds {...props} />
}

export default R.compose(connect(mapStateToProps, mapDispatchToProps))(
  TopUpModal
)
