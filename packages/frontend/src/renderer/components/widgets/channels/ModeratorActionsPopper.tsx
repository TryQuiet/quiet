import React from 'react'

import {
  Popper,
  Fade,
  Paper,
  makeStyles,
  Grid,
  Typography
} from '@material-ui/core'
import { PopperProps } from '@material-ui/core/Popper'

import Icon from '../../ui/Icon/Icon'
import userIcon from '../../../static/images/userIcon.svg'
import banIcon from '../../../static/images/banIcon.svg'

const useStyles = makeStyles((theme) => ({
  root: {
    width: 320,
    height: 150,
    borderRadius: 8,
    backgroundColor: theme.palette.colors.white,
    boxShadow: '0px 2px 25px rgba(0, 0, 0, 0.2)'
  },
  username: {
    lineHeight: '26px',
    fontWeight: 500,
    marginBottom: -3
  },
  user: {
    marginTop: 10,
    marginRight: 12
  },
  address: {
    color: theme.palette.colors.captionPurple,
    lineHeight: '18px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 230,
    whiteSpace: 'nowrap',
    display: 'inline-block'
  },
  info: {
    padding: 10,
    height: 60,
    borderBottom: '1px solid #DBDBDB'
  },
  action: {},
  actions: {
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 14
  },
  removeIcon: {
    marginRight: 10,
    marginTop: 5
  },
  banIcon: {
    marginRight: 6,
    marginTop: 4
  },
  banDiv: { marginTop: 9, cursor: 'pointer' },
  pointer: {
    cursor: 'pointer'
  }
}))

interface ModeratorActionsPopperProps {
  name: string
  address: string
  open: boolean
  anchorEl: PopperProps['anchorEl']
  banUser: () => void
}

export const ModeratorActionsPopper: React.FC<ModeratorActionsPopperProps> = ({
  name,
  address,
  open,
  anchorEl,
  banUser
}) => {
  const classes = useStyles({})
  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      transition
    >
      {({ TransitionProps }) => (
        <Fade {...TransitionProps} timeout={350}>
          <Paper>
            <Typography >
              The content of the Popper.
            </Typography>
          </Paper>
        </Fade>
      )}
      <Grid container direction='column' className={classes.root}>
        <Grid item container direction='row' className={classes.info} spacing={0}>
          <Grid item>
            <Icon className={classes.user} src={userIcon} />
          </Grid>
          <Grid item>
            <Grid item xs={12}>
              <Typography variant='h5' className={classes.username}>
                {name}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant='caption' className={classes.address}>
                {address}
              </Typography>
            </Grid>
          </Grid>
        </Grid>
        <Grid
          item
          container
          direction='column'
          justify='space-between'
          alignItems='center'
          className={classes.actions}
        >
          <Grid
            item
            container
            onClick={() => {
              banUser()
            }}
            className={classes.banDiv}
          >
            <Grid item>
              <Icon className={classes.banIcon} src={banIcon} />
            </Grid>
            <Grid item xs>
              <Typography variant='body1' className={classes.action}>
                Silence user
              </Typography>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Popper>
  )
}

export default ModeratorActionsPopper
