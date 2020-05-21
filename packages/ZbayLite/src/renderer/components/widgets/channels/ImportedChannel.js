import React from 'react'
import Immutable from 'immutable'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'

import Modal from '../../ui/Modal'
import Spinner from '../../ui/SpinnerLoader'
import Icon from '../../ui/Icon'
import chatImage from '../../../static/images/registrationGuide/group-chat.svg'

const styles = theme => ({
  root: {},
  spacing32: {
    marginTop: 32
  },
  spacing16: {
    marginTop: 16
  },
  buttonAccept: {
    height: 60,
    width: 159,
    backgroundColor: theme.palette.colors.zbayBlue,
    color: theme.palette.colors.white,
    '&:hover': {
      backgroundColor: theme.palette.colors.darkPurple
    },
    fontSize: 16,
    lineHeight: '19px'
  },
  buttonSkip: {
    height: 60,
    width: 159,
    color: theme.palette.colors.darkGray,
    fontSize: 16,
    lineHeight: '19px'
  },
  spinner: {
    marginTop: 16
  },
  channelName: {
    fontWeight: 500
  }
})

export const ImportedChannel = ({
  classes,
  onAccept,
  onCancel,
  open,
  handleClose,
  setIsLoading,
  isLoading,
  channel
}) => {
  return (
    <Modal open={open} handleClose={handleClose} title=''>
      {channel ? (
        <Grid
          container
          item
          direction='column'
          alignItems='center'
          className={classes.root}
        >
          <Grid item>
            <Icon className={classes.icon} src={chatImage} />
          </Grid>
          <Grid item>
            <Typography variant='h3'>Join channel</Typography>
          </Grid>
          <Grid item className={classes.spacing16}>
            <Typography variant='body2'>
              You are invited to join the channel{' '}
              <span className={classes.channelName}>#{channel.get('name')}</span>
            </Typography>
          </Grid>
          <Grid item className={classes.spacing32}>
            <Button
              variant='text'
              size='small'
              color='primary'
              onClick={async () => {
                setIsLoading(true)
                await onAccept()
                setIsLoading(false)
              }}
              className={classes.buttonAccept}
              disabled={isLoading}
            >
              {isLoading ? (
                <Spinner size={20} className={classes.spinner} />
              ) : (
                'Accept'
              )}
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant='text'
              size='small'
              color='primary'
              onClick={handleClose}
              className={classes.buttonSkip}
            >
              No thanks
            </Button>
          </Grid>
        </Grid>
      ) : (
        <span />
      )}
    </Modal>
  )
}

ImportedChannel.propTypes = {
  classes: PropTypes.object.isRequired,
  channel: PropTypes.instanceOf(Immutable.Map),
  onAccept: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  setIsLoading: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired
}

export default R.compose(React.memo, withStyles(styles))(ImportedChannel)
