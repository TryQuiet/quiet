import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'

import IconButton from '@material-ui/core/IconButton'

import PersonIcon from '@material-ui/icons/Person'
import AttachMoneyIcon from '@material-ui/icons/AttachMoney'

import Elipsis from '../ui/Elipsis'
import { getZbayAddress } from '../../zbay/channels'
import SettingsModal from '../../containers/widgets/settings/SettingsModal'
import UpdateModal from '../../containers/widgets/update/UpdateModal'
import ReceivedInvitationModal from '../../containers/ui/InvitationModal/ReceivedInvitationModal'

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

export const IdentityPanel = ({ classes, identity, handleSettings, handleInvitation }) => {
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
            <Typography variant='body2' className={classes.name}>
              {identity.name}
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
        <Grid item>
          <IconButton className={classes.settingsButton} onClick={handleInvitation}>
            <AttachMoneyIcon />
          </IconButton>
          <IconButton className={classes.settingsButton} onClick={handleSettings}>
            <PersonIcon />
          </IconButton>
        </Grid>
      </Grid>
      <SettingsModal />
      <UpdateModal />
      <ReceivedInvitationModal />
    </React.Fragment>
  )
}

IdentityPanel.propTypes = {
  classes: PropTypes.object.isRequired,
  identity: PropTypes.shape({
    name: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired
  }).isRequired,
  handleSettings: PropTypes.func.isRequired,
  handleInvitation: PropTypes.func.isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(IdentityPanel)
