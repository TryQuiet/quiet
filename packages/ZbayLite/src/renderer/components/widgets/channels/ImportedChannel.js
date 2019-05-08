import React from 'react'
import Immutable from 'immutable'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'

import HttpsIcon from '@material-ui/icons/HttpsOutlined'

import Elipsis from '../../ui/Elipsis'

const styles = theme => ({
  root: {
    padding: theme.spacing.unit * 4
  },
  about: {
    paddingLeft: theme.spacing.unit,
    paddingRight: theme.spacing.unit,
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
    marginTop: theme.spacing.unit
  }
})

export const ImportedChannel = ({ classes, channel, onAccept, onCancel }) => (
  channel
    ? (
      <Grid container item direction='column' spacing={16} className={classes.root}>
        <Grid item container>
          <Grid container item alignItems='flex-end'>
            <Typography variant='subtitle1' className={classes.title}>
              {channel.get('name')}
            </Typography>
            {
              channel.get('private', false)
                ? <HttpsIcon fontSize='inherit' className={classes.privacy} />
                : null
            }
          </Grid>
          <Elipsis
            interactive
            content={channel.get('address')}
            tooltipPlacement='bottom-start'
            classes={{ content: classes.uri }}
          />
        </Grid>
        <Grid item>
          <Typography variant='subtitle1'>
            About
          </Typography>
          <Typography variant='body2' className={classes.about}>
            {channel.get('description')}
          </Typography>
        </Grid>
        <Grid item container spacing={16} justify='flex-end' className={classes.actions}>
          <Grid item>
            <Button
              variant='outlined'
              size='small'
              color='primary'
              onClick={onCancel}
            >
              Cancel
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant='contained'
              size='small'
              color='primary'
              onClick={onAccept}
            >
              Accept
            </Button>
          </Grid>
        </Grid>
      </Grid>
    )
    : null
)

ImportedChannel.propTypes = {
  classes: PropTypes.object.isRequired,
  channel: PropTypes.instanceOf(Immutable.Map)
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(ImportedChannel)
