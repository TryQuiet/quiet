import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import UnlockVault from '../../components/windows/UnlockVault'
import nodeHandlers from '../../store/handlers/node'
import nodeSelectors from '../../store/selectors/node'

export const mapStateToProps = state => ({
  nodeStatus: nodeSelectors.status(state)
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      getStatus: nodeHandlers.epics.getStatus
    },
    dispatch
  )

export default connect(mapStateToProps, mapDispatchToProps)(UnlockVault)
