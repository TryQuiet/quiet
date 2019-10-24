import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'
import { Button } from '@material-ui/core'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'

import SettingsModal from '../../containers/widgets/settings/SettingsModal'
import ReceivedInvitationModal from '../../containers/ui/InvitationModal/ReceivedInvitationModal'
import CreateUsernameModal from '../../containers/widgets/createUsernameModal/CreateUsername'
import ImportChannelModal from '../../containers/widgets/channels/importChannel/ImportChannelModal'

const styles = theme => ({
  root: {
    marginTop: theme.spacing(1),
    WebkitAppRegion: 'drag',
    paddingLeft: 16,
    paddingRight: 16
  },

  button: {
    color: theme.palette.colors.white,
    padding: 0,
    textAlign: 'left',
    opacity: 0.8,
    '&:hover': {
      opacity: 1,
      backgroundColor: 'inherit'
    }
  },
  buttonLabel: {
    justifyContent: 'flex-start',
    textTransform: 'none'
  }
})

export const IdentityPanel = ({ classes, identity, handleSettings, user }) => {
  const nickname = user ? user.nickname : `anon${identity.signerPubKey.substring(0, 10)}`
  return (
    <div className={classes.root}>
      <Button
        onClick={handleSettings}
        component='span'
        classes={{ root: classes.button, label: classes.buttonLabel }}
      >
        <Typography variant='h4'>{nickname}</Typography>
        <ExpandMoreIcon fontSize='small' />
      </Button>
      <SettingsModal />
      <ReceivedInvitationModal />
      <ImportChannelModal />
      <CreateUsernameModal />
    </div>
  )
}

IdentityPanel.propTypes = {
  classes: PropTypes.object.isRequired,
  identity: PropTypes.shape({
    name: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    signerPubKey: PropTypes.string.isRequired
  }).isRequired,
  handleSettings: PropTypes.func.isRequired,
  user: PropTypes.shape({
    nickname: PropTypes.string.isRequired
  }).isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(IdentityPanel)
