
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import ShippingSettingsForm from '../../../components/widgets/settings/ShippingSettingsForm'
import identityHandlers from '../../../store/handlers/identity'

export const mapStateToProps = _state => ({
  initialValues: ''
})

export const mapDispatchToProps = dispatch => bindActionCreators({
  handleSubmit: identityHandlers.epics.updateShippingData
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(ShippingSettingsForm)
