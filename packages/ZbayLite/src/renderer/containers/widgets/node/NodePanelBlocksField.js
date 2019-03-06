import React from 'react'
import { connect } from 'react-redux'

import Typography from '@material-ui/core/Typography'

import NodePanelField from '../../../components/widgets/node/NodePanelField'

import nodeSelectors from '../../../store/selectors/node'

export const mapStateToProps = state => ({
  latestBlock: nodeSelectors.latestBlock(state),
  currentBlock: nodeSelectors.currentBlock(state)
})

export const NodePanelBlocksField = ({ latestBlock, currentBlock }) => (
  <NodePanelField name='Blocks'>
    <Typography inline variant='overline'>
      {currentBlock} / {latestBlock || '?'}
    </Typography>
  </NodePanelField>
)

export default connect(mapStateToProps)(NodePanelBlocksField)
