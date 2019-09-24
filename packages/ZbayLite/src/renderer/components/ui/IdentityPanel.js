import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'

import IconButton from '@material-ui/core/IconButton'

import PersonIcon from '@material-ui/icons/Person'

import Elipsis from '../ui/Elipsis'
import { getZbayAddress } from '../../zbay/channels'
import SettingsModal from '../../containers/widgets/settings/SettingsModal'

const styles = theme => ({
  root: {
    padding: `${theme.spacing(1)}px ${theme.spacing(2)}px`,
    marginTop: process.platform === 'darwin' && theme.spacing(1.5)
  },
  name: {
    lineHeight: 1.2
  },
  settingsButton: {
    padding: theme.spacing(0.5),
    color: theme.palette.colors.white
  },
  uri: {
    lineHeight: 1.2,
    color: 'rgb(255,255,255,0.6)'
  }
})

export const IdentityPanel = ({ classes, identity, handleSettings }) => {
  const zbayUri = getZbayAddress(identity.address)
  return (
    <React.Fragment>
      <Grid
        container
        className={classes.root}
        direction='row'
        justify='space-between'
        alignItems='center'
      >
        <Grid item>
          <Grid container direction='column'>
            <Typography variant='subtitle1' className={classes.name}>
              {identity.name} (you)
            </Typography>
            <Elipsis
              interactive
              content={zbayUri}
              length={30}
              tooltipPlacement='bottom-start'
              classes={{ content: classes.uri }}
            />
          </Grid>
        </Grid>
        <IconButton className={classes.settingsButton} onClick={handleSettings}>
          <PersonIcon />
        </IconButton>
      </Grid>
      <SettingsModal />
    </React.Fragment>
  )
}

IdentityPanel.propTypes = {
  classes: PropTypes.object.isRequired,
  identity: PropTypes.shape({
    name: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired
  }).isRequired,
  handleSettings: PropTypes.func.isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(IdentityPanel)
