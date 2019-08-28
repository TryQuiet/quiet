import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import ShippingSettingsForm from '../../../components/widgets/settings/ShippingSettingsForm'

export const mapDispatchToProps = dispatch => bindActionCreators({
  handleSubmit: (data) => console.log('Submitting: ', data)
}, dispatch)

export default connect(null, mapDispatchToProps)(ShippingSettingsForm)
