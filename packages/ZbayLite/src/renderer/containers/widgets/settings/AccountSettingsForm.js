import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import AccountSettingsForm from '../../../components/widgets/settings/AccountSettingsForm'
import identitySelectors from '../../../store/selectors/identity'

export const mapStateToProps = state => ({
  initialValues: {
    nickname: identitySelectors.name(state)
  },
  transparentAddress: identitySelectors.transparentAddress(state),
  privateAddress: identitySelectors.address(state)
})

export const mapDispatchToProps = dispatch => bindActionCreators({
  handleSubmit: (data) => console.log('Submitting: ', data)
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(AccountSettingsForm)
