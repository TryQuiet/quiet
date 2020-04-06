import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as R from 'ramda'

import logsHandlers from '../../../store/handlers/logs'
import logsSelectors from '../../../store/selectors/logs'

import Logs from '../../../components/widgets/logs/Logs'

export const mapStateToProps = state => ({
  debugLogs: logsSelectors.nodeLogs(state),
  applicationLogs: logsSelectors.applicationLogs(state),
  transactionsLogs: logsSelectors.transactionsLogs(state)
})

export const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      closeLogsWindow: logsHandlers.epics.closeLogsWindow
    },
    dispatch
  )

export const LogsContainer = ({ debugLogs, closeLogsWindow, applicationLogs, transactionsLogs, height }) => <Logs debugLogs={debugLogs} height={height} closeLogsWindow={closeLogsWindow} applicationLogs={applicationLogs} transactionsLogs={transactionsLogs} />

export default R.compose(
  connect(mapStateToProps, mapDispatchToProps)
)(LogsContainer)
