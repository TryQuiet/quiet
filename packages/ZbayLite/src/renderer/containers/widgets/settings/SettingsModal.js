import * as R from 'ramda'

import SettingsModal from '../../../components/widgets/settings/SettingsModal'
import { withModal } from '../../../store/handlers/modals'

export default R.compose(
  withModal('accountSettingsModal')
)(SettingsModal)
