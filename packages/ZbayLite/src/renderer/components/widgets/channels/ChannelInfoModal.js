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
    padding: `${theme.spacing(4)}px ${theme.spacing(4)}px`,
    height: '100%',
    width: '100%'
  },
  title: {
    fontSize: '1.2rem',
    lineHeight: '1.66'
  },
  infoTitle: {
    marginTop: theme.spacing(2),
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

export const ChannelInfoModal = ({
  classes,
  channel,
  shareUri,
  open,
  handleClose,
  directMessage
}) => {
  const address = directMessage ? channel.get('targetRecipientAddress') : shareUri
  return (
    <Modal open={open} handleClose={handleClose} title='Info' fullPage>
      <Grid container direction='column' className={classes.root}>
        <Grid item className={classes.section}>
          <Typography variant='subtitle1' className={classes.title}>
            {directMessage ? channel.get('targetRecipientUsername') : channel.get('name')}
          </Typography>
        </Grid>
        <Grid item className={classes.section}>
          <Typography variant='subtitle1' className={classes.infoTitle}>
            {!directMessage && 'About'}
          </Typography>
          <Typography variant='caption' className={classes.description}>
            {channel.get('description')}
          </Typography>
        </Grid>
        <Grid item container direction='column' className={classes.section}>
          <Grid container item direction='row'>
            <Typography variant='subtitle1' display='inline' className={classes.infoTitle}>
              Share link
              {directMessage ? 'Address' : 'Share link'}
            </Typography>
            <CopyToClipboard text={address}>
              <IconButton className={classes.copyButton}>
                <FileCopyIcon fontSize='inherit' />
              </IconButton>
            </CopyToClipboard>
          </Grid>
          <Grid item>
            <Typography variant='caption' className={classes.description}>
              {address}
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </Modal>
  )
}

ChannelInfoModal.propTypes = {
  classes: PropTypes.object.isRequired,
  channel: PropTypes.oneOfType([
    PropTypes.instanceOf(Immutable.Map),
    PropTypes.instanceOf(Immutable.Record)
  ]).isRequired,
  shareUrl: PropTypes.string.isRequired,
  handleClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  directMessage: PropTypes.bool.isRequired
}

ChannelInfoModal.defaultProps = {
  open: false,
  channel: Immutable.Map(),
  shareUrl: '',
  directMessage: false
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(ChannelInfoModal)
