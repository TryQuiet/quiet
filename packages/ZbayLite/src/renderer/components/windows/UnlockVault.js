import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import Grid from '@material-ui/core/Grid'

import WindowWrapper from '../ui/WindowWrapper'
import VaultUnlockerForm from '../../containers/widgets/VaultUnlockerForm'

const styles = theme => ({
  gridRoot: {
    'min-height': '100vh',
    WebkitAppRegion: process.platform === 'win32' ? 'no-drag' : 'drag'
  }
})

export const UnlockVault = ({ classes, locked }) => {
  return (
    <WindowWrapper>
      <Grid
        container
        justify='center'
        alignItems='center'
        className={classes.gridRoot}
      >
        <VaultUnlockerForm />
      </Grid>
    </WindowWrapper>
  )
}

UnlockVault.propTypes = {
  classes: PropTypes.object.isRequired,
  locked: PropTypes.bool.isRequired
}

UnlockVault.defaultProps = {
  locked: true
}

export default withStyles(styles)(UnlockVault)
