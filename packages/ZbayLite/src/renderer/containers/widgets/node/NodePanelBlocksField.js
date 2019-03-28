import React from 'react'
import BigNumber from 'bignumber.js'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import Typography from '@material-ui/core/Typography'

import NodePanelField from '../../../components/widgets/node/NodePanelField'

import nodeSelectors from '../../../store/selectors/node'

export const mapStateToProps = state => ({
  latestBlock: nodeSelectors.latestBlock(state),
  currentBlock: nodeSelectors.currentBlock(state)
})

export const NodePanelBlocksField = ({ latestBlock, currentBlock }) => {
  const outOf = (
    latestBlock.isZero()
      ? '?'
      : `~${latestBlock.toString()}`
  )
  return (
    <NodePanelField name='Blocks'>
      <Typography inline variant='overline'>
        {currentBlock.toString()} / {outOf}
      </Typography>
    </NodePanelField>
  )
}

NodePanelBlocksField.propTypes = {
  latestBlock: PropTypes.instanceOf(BigNumber),
  currentBlock: PropTypes.instanceOf(BigNumber)
}

export default connect(mapStateToProps)(NodePanelBlocksField)
