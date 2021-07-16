import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

// import nodeHandlers from '../../store/handlers/node'
// import nodeSelectors from '../../store/selectors/node'
import SyncLoader from '../../components/windows/SyncLoader'

export const mapStateToProps = _state => ({
  // nodeStatus: nodeSelectors.status(state),
  // latestBlock: nodeSelectors.latestBlock(state),
  // currentBlock: nodeSelectors.currentBlock(state)
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      // getStatus: nodeHandlers.epics.getStatus
    },
    dispatch
  )

export default connect(mapStateToProps, mapDispatchToProps)(SyncLoader)
