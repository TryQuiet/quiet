import React from 'react'
import PropTypes from 'prop-types'
import BigNumber from 'bignumber.js'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'

import ChannelInput from '../../../containers/widgets/channels/ChannelInput'
import ChannelMessages from '../../../containers/widgets/channels/ChannelMessages'
import { withSpinnerLoader } from '../../ui/SpinnerLoader'

const styles = {
  fullHeight: {
    minHeight: '100%'
  }
}

// TODO: filter by spent
export const ChannelContent = ({ classes, channelId, balance }) => (
  <Grid
    container
    direction='column'
    justify='center'
    className={classes.fullHeight}
  >
    <ChannelMessages channelId={channelId} />
    <ChannelInput disabled={balance.isZero()} />
  </Grid>
)

ChannelContent.propTypes = {
  classes: PropTypes.object.isRequired,
  channelId: PropTypes.string,
  balance: PropTypes.instanceOf(BigNumber)
}

ChannelContent.defaultProps = {
  balance: new BigNumber(0)
}

export default R.compose(
  withSpinnerLoader,
  withStyles(styles)
)(ChannelContent)
