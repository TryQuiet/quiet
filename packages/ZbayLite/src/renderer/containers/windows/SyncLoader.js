import React from 'react'
import { Redirect } from 'react-router'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import SyncLoaderComponent from '../../components/windows/SyncLoader'
import nodeSelectors from '../../store/selectors/node'
import nodeHandlers from '../../store/handlers/node'

import { useInterval } from '../hooks'

export const mapStateToProps = state => ({
  node: nodeSelectors.node(state)
})
export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      getStatus: nodeHandlers.epics.getStatus
    },
    dispatch
  )

export const SyncLoader = ({ node, getStatus }) => {
  useInterval(getStatus, 15000)
  return node.currentBlock.div(node.latestBlock).lt(0.99) ? (
    <SyncLoaderComponent node={node} />
  ) : (
    <Redirect to='/main/channel/general' />
  )
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SyncLoader)
