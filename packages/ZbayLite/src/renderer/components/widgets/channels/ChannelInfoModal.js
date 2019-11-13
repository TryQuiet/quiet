import React from 'react'
import PropTypes from 'prop-types'
import Immutable from 'immutable'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import { Button } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'

import Modal from '../../ui/Modal'

const styles = theme => ({
  root: {
    padding: `${theme.spacing(4)}px ${theme.spacing(4)}px`,
    height: '100%',
    width: '100%'
  },
  title: {
    fontWeight: 500
  },
  infoTitle: {
    fontWeight: 500,
    marginTop: theme.spacing(2)
  },
  description: {
    marginTop: 6,
    fontWeight: 'normal',
    fontStyle: 'normal',
    color: theme.palette.colors.trueBlack
  },
  section: {
    width: '100%',
    wordBreak: 'break-all'
  },
  copyButton: {
    marginTop: 24,
    textTransform: 'none',
    width: 488,
    height: 60,
    color: theme.palette.colors.white,
    backgroundColor: theme.palette.colors.purple
  },
  addressBox: {
    marginTop: 24,
    fontSize: 16,
    lineHeight: '19px',
    width: 536,
    padding: 24,
    borderRadius: 4,
    backgroundColor: theme.palette.colors.veryLightGray
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
    <Modal open={open} handleClose={handleClose} fullPage>
      <Grid container direction='column' className={classes.root}>
        <Grid item className={classes.section}>
          <Typography variant='h3' className={classes.title}>
            {directMessage ? channel.get('targetRecipientUsername') : channel.get('name')}
          </Typography>
        </Grid>
        <Grid item className={classes.section}>
          <Typography variant='subtitle1' className={classes.infoTitle}>
            {!directMessage && 'About'}
          </Typography>
          <Typography variant='body2' className={classes.description}>
            {channel.get('description')}
          </Typography>
        </Grid>
        <Grid item container direction='column' className={classes.section}>
          <Grid container item direction='row'>
            <Typography variant='subtitle1' display='inline' className={classes.infoTitle}>
              {directMessage ? 'Address' : 'Share link'}
            </Typography>
          </Grid>
          <Grid container item className={classes.addressBox}>
            <Grid item>
              <Typography variant='body2' className={classes.description}>
                {address}
              </Typography>
            </Grid>
            <Grid>
              <CopyToClipboard text={address}>
                <Button className={classes.copyButton} variant={'large'}>Copy to clipboard</Button>
              </CopyToClipboard>
            </Grid>
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
