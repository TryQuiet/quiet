import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import identityHandlers from '../../../store/handlers/identity'
import DonationsSettingsForm from '../../../components/widgets/settings/DonationsSettingsForm'
import identitySelectors from '../../../store/selectors/identity'

export const mapStateToProps = state => {
  return {
    initialValues: {
      donationAddress: identitySelectors.donationAddress(state)
    },
    donationAllow: identitySelectors.donationAllow(state),
    shieldingTax: identitySelectors.shieldingTax(state)
  }
}

export const mapDispatchToProps = (dispatch, props) =>
  bindActionCreators(
    {
      updateDonation: identityHandlers.epics.updateDonation,
      setDonationAddress: identityHandlers.actions.setDonationAddress,
      setDonationAllow: identityHandlers.actions.setDonationAllow,
      setShieldingTax: identityHandlers.actions.setShieldingTax,
      updateShieldingTax: identityHandlers.epics.updateShieldingTax,
      updateDonationAddress: (address) => identityHandlers.epics.updateDonationAddress(address)
    },
    dispatch
  )

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DonationsSettingsForm)
