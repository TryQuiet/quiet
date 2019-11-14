import React, { useEffect, useState } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as R from 'ramda'

import SettingsModal from '../../../components/widgets/settings/SettingsModal'
import { withModal } from '../../../store/handlers/modals'
import { actions } from '../../../store/handlers/app'
import appSelectors from '../../../store/selectors/app'

const mapStateToProps = (state) => ({
  modalTabToOpen: appSelectors.currentModalTab(state)
})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  clearCurrentOpenTab: actions.clearModalTab
}, dispatch)

const SettingsModalContainer = (props) => {
  const [currentTab, setCurrentTab] = useState('account')

  useEffect(
    () => {
      props.clearCurrentOpenTab()
    },
    [currentTab]
  )
  return <SettingsModal {...props} setCurrentTab={setCurrentTab} currentTab={currentTab} />
}

export default R.compose(
  withModal('accountSettingsModal'),
  connect(mapStateToProps, mapDispatchToProps)
)(SettingsModalContainer)
