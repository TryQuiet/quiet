import { connect } from 'react-redux'

import NodeStatus from '../../../components/widgets/node/NodeStatus'

import nodeSelectors from '../../../store/selectors/node'
import identitySelectors from '../../../store/selectors/identity'

export const mapStateToProps = state => ({
  status: nodeSelectors.status(state),
  percentSynced: nodeSelectors.percentSynced(state),
  freeUtxos: identitySelectors.freeUtxos(state)
})

export default connect(mapStateToProps)(NodeStatus)
