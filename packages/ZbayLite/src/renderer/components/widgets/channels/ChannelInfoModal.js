import React from 'react'
import PropTypes from 'prop-types'
import Immutable from 'immutable'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'

import IconButton from '@material-ui/core/IconButton'
import FileCopyIcon from '@material-ui/icons/FileCopy'

import Modal from '../../ui/Modal'

const styles = theme => ({
  root: {
    padding: `${4 * theme.spacing.unit}px ${4 * theme.spacing.unit}px`,
    height: '100%',
    width: '100%'
  },
  title: {
    fontSize: '1.2rem',
    lineHeight: '1.66'
  },
  infoTitle: {
    marginTop: theme.spacing.unit * 2,
    fontSize: '0.9rem'
  },
  description: {
    fontSize: '0.8rem',
    color: theme.palette.primary.main
  },
  section: {
    width: '100%',
    wordBreak: 'break-all'
  },
  copyButton: {
    fontSize: '1.2rem',
    marginTop: 6
  }
})

export const ChannelInfoModal = ({ classes, channel, shareUri, open, handleClose }) => (
  <Modal
    open={open}
    handleClose={handleClose}
    title='Info'
    fullPage
  >
    <Grid
      container
      direction='column'
      className={classes.root}
    >
      <Grid item className={classes.section}>
        <Typography variant='subtitle1' className={classes.title}>
          {channel.get('name')}
        </Typography>
      </Grid>
      <Grid item className={classes.section}>
        <Typography variant='subtitle1' className={classes.infoTitle}>
          About
        </Typography>
        <Typography variant='caption' className={classes.description}>
          {channel.get('description')}
        </Typography>
      </Grid>
      <Grid item container direction='column' className={classes.section}>
        <Grid container item direction='row'>
          <Typography variant='subtitle1' inline className={classes.infoTitle}>
            Share link
          </Typography>
          <CopyToClipboard text={shareUri}>
            <IconButton className={classes.copyButton}>
              <FileCopyIcon fontSize='inherit' />
            </IconButton>
          </CopyToClipboard>
        </Grid>
        <Grid item>
          <Typography variant='caption' className={classes.description}>
            {shareUri}
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  </Modal>
)

ChannelInfoModal.propTypes = {
  classes: PropTypes.object.isRequired,
  channel: PropTypes.instanceOf(Immutable.Map).isRequired,
  shareUrl: PropTypes.string.isRequired,
  handleClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired
}

ChannelInfoModal.defaultProps = {
  open: false,
  channel: Immutable.Map(),
  shareUrl: ''
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(ChannelInfoModal)
