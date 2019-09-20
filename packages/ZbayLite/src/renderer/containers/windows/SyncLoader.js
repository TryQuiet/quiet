import React from 'react'
import { Redirect } from 'react-router'
import { connect } from 'react-redux'

import SyncLoaderComponent from '../../components/windows/SyncLoader'
import nodeSelectors from '../../store/selectors/node'

export const mapStateToProps = state => ({
  node: nodeSelectors.node(state)
})

export const SyncLoader = ({ node }) => {
  return node.currentBlock.div(node.latestBlock).lt(0.97) ? (
    <SyncLoaderComponent node={node} />
  ) : (
    <Redirect to='/main/channel/general' />
  )
}

export default connect(mapStateToProps)(SyncLoader)
