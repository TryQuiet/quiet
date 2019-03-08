import { connect } from 'react-redux'

import ZecBalance from '../../../components/widgets/walletPanel/ZecBalance'

import identitySelectors from '../../../store/selectors/identity'

export const mapStateToProps = state => ({
  value: identitySelectors.balance('zec')(state)
})

export default connect(mapStateToProps)(ZecBalance)
