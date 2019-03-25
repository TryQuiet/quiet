import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'

import ChannelInput from '../../../containers/widgets/channels/ChannelInput'
import ChannelMessages from '../../../containers/widgets/channels/ChannelMessages'

const styles = {
  fullHeight: {
    minHeight: '100%'
  }
}

// TODO: filter by spent
export const ChannelContent = ({ classes }) => (
  <Grid
    container
    direction='column'
    justify='center'
    className={classes.fullHeight}
  >
    <ChannelMessages />
    <ChannelInput />
  </Grid>
)

ChannelContent.propTypes = {
  classes: PropTypes.object.isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(ChannelContent)
