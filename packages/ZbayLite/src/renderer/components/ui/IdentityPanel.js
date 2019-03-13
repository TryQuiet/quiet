import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'

import Elipsis from '../ui/Elipsis'

const styles = theme => ({
  root: {
    padding: `${1.5 * theme.spacing.unit}px ${2 * theme.spacing.unit}px`
  },
  name: {
    lineHeight: 1.2
  },
  uri: {
    lineHeight: 1.2
  }
})

const getZbayAddress = (zcashAddress) => `zbay.io/uri/${zcashAddress}`

export const IdentityPanel = ({ classes, identity }) => {
  const zbayUri = getZbayAddress(identity.address)
  return (
    <Grid item container className={classes.root} direction='column'>
      <Typography variant='subtitle1' className={classes.name}>
        {identity.name} (you)
      </Typography>
      <Elipsis
        interactive
        content={zbayUri}
        tooltipPlacement='left'
        classes={{ content: classes.uri }}
      />
    </Grid>
  )
}

IdentityPanel.propTypes = {
  classes: PropTypes.object.isRequired,
  identity: PropTypes.shape({
    name: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired
  }).isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(IdentityPanel)
