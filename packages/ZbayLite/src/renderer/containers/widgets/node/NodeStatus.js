import { connect } from 'react-redux'

import NodeStatus from '../../../components/widgets/node/NodeStatus'

import nodeSelectors from '../../../store/selectors/node'

export const mapStateToProps = state => ({
  status: nodeSelectors.status(state),
  percentSynced: nodeSelectors.percentSynced(state)
})

export default connect(mapStateToProps)(NodeStatus)
