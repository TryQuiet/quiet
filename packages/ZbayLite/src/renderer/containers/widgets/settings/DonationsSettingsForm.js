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
    donationAllow: identitySelectors.donationAllow(state)
  }
}

export const mapDispatchToProps = (dispatch, props) =>
  bindActionCreators(
    {
      updateDonation: identityHandlers.epics.updateDonation,
      updateDonationAddress: (address) => identityHandlers.epics.updateDonationAddress(address)
    },
    dispatch
  )

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DonationsSettingsForm)
