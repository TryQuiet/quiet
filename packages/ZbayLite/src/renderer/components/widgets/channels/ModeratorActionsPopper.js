import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import {
  Popper,
  Fade,
  Paper,
  withStyles,
  Grid,
  Typography
} from '@material-ui/core'

import Icon from '../../ui/Icon'
import userIcon from '../../../static/images/userIcon.svg'
import banIcon from '../../../static/images/banIcon.svg'
import removeMessageIcon from '../../../static/images/removeMessageIcon.svg'

const styles = theme => ({
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
})
export const ModeratorActionsPopper = ({
  classes,
  name,
  address,
  open,
  anchorEl,
  banUser,
  removeMessage
}) => (
  <Popper
    open={open}
    anchorEl={anchorEl}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'center'
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'center'
    }}
    transition
  >
    {({ TransitionProps }) => (
      <Fade {...TransitionProps} timeout={350}>
        <Paper>
          <Typography className={classes.typography}>
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
            removeMessage()
          }}
          className={classes.pointer}
        >
          <Grid item>
            <Icon className={classes.removeIcon} src={removeMessageIcon} />
          </Grid>
          <Grid item xs>
            <Typography variant='body1' className={classes.action}>
              Hide message
            </Typography>
          </Grid>
        </Grid>
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

ModeratorActionsPopper.propTypes = {
  classes: PropTypes.object.isRequired,
  anchorEl: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  address: PropTypes.string.isRequired,
  open: PropTypes.bool.isRequired,
  removeMessage: PropTypes.func.isRequired,
  banUser: PropTypes.func.isRequired
}

export default R.compose(React.memo, withStyles(styles))(ModeratorActionsPopper)
