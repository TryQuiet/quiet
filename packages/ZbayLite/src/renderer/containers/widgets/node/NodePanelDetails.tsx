import { connect } from 'react-redux'

import NodePanelDetails from '../../../components/widgets/node/NodePanelDetails'

import appSelectors from '../../../store/selectors/app'

export const mapStateToProps = state => ({
  zbayVersion: appSelectors.version(state)
})

export default connect(mapStateToProps)(NodePanelDetails)
