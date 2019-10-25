import React from 'react'
import Immutable from 'immutable'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'
import HttpsIcon from '@material-ui/icons/HttpsOutlined'

import Modal from '../../ui/Modal'
import Elipsis from '../../ui/Elipsis'
import Spinner from '../../ui/SpinnerLoader'
const styles = theme => ({
  root: {
    padding: theme.spacing(4)
  },
  about: {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    color: theme.palette.primary.main
  },
  uri: {
    lineHeight: 1.2
  },
  title: {
    fontSize: '1.2rem',
    lineHeight: 1.2
  },
  privacy: {
    fontSize: '0.9rem'
  },
  actions: {
    marginTop: theme.spacing(1)
  },
  button: {
    height: 34,
    width: 77
  },
  spinner: {
    marginTop: 3
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
    <Modal open={open} handleClose={handleClose} title='Import Channel'>
      {channel ? (
        <Grid container item direction='column' spacing={2} className={classes.root}>
          <Grid item container>
            <Grid container item alignItems='flex-end'>
              <Typography variant='subtitle1' className={classes.title}>
                {channel.get('name')}
              </Typography>
              {channel.get('private', false) ? (
                <HttpsIcon fontSize='inherit' className={classes.privacy} />
              ) : null}
            </Grid>
            <Elipsis
              interactive
              content={channel.get('address')}
              tooltipPlacement='bottom-start'
              classes={{ content: classes.uri }}
            />
          </Grid>
          <Grid item>
            <Typography variant='subtitle1'>About</Typography>
            <Typography variant='body2' className={classes.about}>
              {channel.get('description')}
            </Typography>
          </Grid>
          <Grid item container spacing={2} justify='flex-end' className={classes.actions}>
            <Grid item>
              <Button
                variant='outlined'
                size='small'
                color='primary'
                onClick={handleClose}
                className={classes.button}
              >
                Cancel
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant='contained'
                size='small'
                color='primary'
                onClick={async () => {
                  setIsLoading(true)
                  await onAccept()
                  setIsLoading(false)
                }}
                className={classes.button}
                disabled={isLoading}
              >
                {isLoading ? <Spinner size={20} className={classes.spinner} /> : 'Accept'}
              </Button>
            </Grid>
          </Grid>
        </Grid>
      ) : null}
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

export default R.compose(
  React.memo,
  withStyles(styles)
)(ImportedChannel)
