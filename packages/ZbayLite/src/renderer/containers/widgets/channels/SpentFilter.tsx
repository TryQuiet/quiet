import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import SpentFilter from '../../../components/widgets/channels/SpentFilter'

import channelSelectors from '../../../store/selectors/channel'
import channelHandlers from '../../../store/handlers/channel'

export const mapStateToProps = state => ({
  value: channelSelectors.spentFilterValue(state)
})

export const mapDispatchToProps = dispatch => bindActionCreators({
  handleOnChange: channelHandlers.actions.setSpentFilterValue
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(SpentFilter)
