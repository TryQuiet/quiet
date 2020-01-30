import React, { useState } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as R from 'ramda'

import ChannelSettingsModalComponent from '../../../components/widgets/channelSettings/ChannelSettingsModal'
import { withModal } from '../../../store/handlers/modals'
import { actions } from '../../../store/handlers/app'
import channelSelector from '../../../store/selectors/channel'

export const mapStateToProps = state => {
  return {
    channel: channelSelector.data(state)
  }
}

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      clearCurrentOpenTab: actions.clearModalTab
    },
    dispatch
  )

const ChannelSettingsModal = props => {
  const [currentTab, setCurrentTab] = useState('channelInfo')
  return (
    <ChannelSettingsModalComponent
      {...props}
      setCurrentTab={setCurrentTab}
      currentTab={currentTab}
    />
  )
}

export default R.compose(
  withModal('channelSettingsModal'),
  connect(mapStateToProps, mapDispatchToProps)
)(ChannelSettingsModal)
