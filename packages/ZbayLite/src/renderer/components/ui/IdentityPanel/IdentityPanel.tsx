import React from 'react'

import Typography from '@material-ui/core/Typography'
import { Button } from '@material-ui/core'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'

import { makeStyles } from '@material-ui/core/styles'
import { Identity } from '@zbayapp/nectar/lib/sagas/identity/identity.slice'

const useStyles = makeStyles(theme => ({
  root: {
    marginTop: theme.spacing(1),
    WebkitAppRegion: process.platform === 'win32' ? 'no-drag' : 'drag',
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
  },
  nickname: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 175,
    whiteSpace: 'nowrap'
  }
}))

interface IdentityPanelProps {
  identity: Identity
  handleSettings: () => void
}

export const IdentityPanel: React.FC<IdentityPanelProps> = ({ handleSettings, identity }) => {
  const classes = useStyles({})

  return (
    <div className={classes.root}>
      <Button
        onClick={handleSettings}
        component='span'
        classes={{ root: classes.button, label: classes.buttonLabel }}>
        <Typography variant='h4' className={classes.nickname}>
          {identity?.zbayNickname ? identity.zbayNickname : ''}
        </Typography>
        <ExpandMoreIcon fontSize='small' />
      </Button>
    </div>
  )
}

export default IdentityPanel
