import React from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { AutoSizer } from 'react-virtualized'
import { Scrollbars } from 'rc-scrollbars'
import classNames from 'classnames'
import Grid from '@material-ui/core/Grid'
import { Button } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'

import Modal from '../../ui/Modal/Modal'
import { Channel } from '../../../store/handlers/channel'
import { Contact } from '../../../store/handlers/contacts'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: `${theme.spacing(4)}px ${theme.spacing(4)}px`
  },
  title: {
    fontWeight: 500
  },
  infoTitle: {
    fontWeight: 500
  },
  spacing28: {
    marginTop: 28
  },
  spacing24: {
    marginTop: 24
  },
  description: {
    fontWeight: 'normal',
    fontStyle: 'normal',
    color: theme.palette.colors.trueBlack,
    lineHeight: '20px'
  },
  section: {
    width: '100%',
    wordBreak: 'break-word'
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
    border: '1px solid',
    borderColor: theme.palette.colors.gray50,
    borderRadius: 4,
    backgroundColor: theme.palette.colors.veryLightGray
  },
  shareWarrning: {
    marginTop: 8,
    wordBreak: 'break-word',
    lineHeight: '20px'
  }
}))

export interface ChannelInfoModalProps {
  channel?: Channel
  channelData?: Contact
  shareUri?: string
  open?: boolean
  handleClose?: (event: {}, reason: 'backdropClick' | 'escapeKeyDown') => void
  directMessage?: boolean
}

export const ChannelInfoModal: React.FC<ChannelInfoModalProps> = ({
  channel = {},
  channelData,
  shareUri,
  open = false,
  handleClose,
  directMessage = false
}) => {
  const classes = useStyles({})
  const address = directMessage ? channelData?.address : shareUri
  return (
    <Modal
      open={open}
      handleClose={handleClose}
      title='Channel Information'
      fullPage
      isBold
    >
      <AutoSizer>
        {({ width, height }) => (
          <Scrollbars
            autoHideTimeout={500}
            style={{ width: width, height: height }}
          >
            <Grid container direction='column' className={classes.root}>
              <Grid item className={classes.section}>
                <Typography variant='h3' className={classes.title}>
                  {channel.name}
                </Typography>
              </Grid>
              <Grid
                item
                className={classNames(classes.section, classes.spacing24)}
              >
                <Typography variant='subtitle1' className={classes.infoTitle}>
                  {!directMessage && `About #${channel.name}`}
                </Typography>
                <Typography variant='body2' className={classes.description}>
                  {channel.name}
                </Typography>
              </Grid>
              <Grid
                item
                container
                direction='column'
                className={classes.section}
              >
                <Grid
                  item
                  container
                  direction='column'
                >
                  <Grid item className={classes.spacing28}>
                    <Typography
                      variant='subtitle1'
                      display='inline'
                      className={classes.infoTitle}
                    >
                      {directMessage ? 'Address' : 'Inviting others'}
                    </Typography>
                  </Grid>
                  {!directMessage && (
                    <Grid item>
                      <Typography
                        variant='body2'
                        className={classes.shareWarrning}
                      >
                        To invite others to this channel, share this link. If
                        they don’t already have Zbay they will have a chance to
                        download it. Once they have Zbay, opening the link in
                        Zbay will give them access to the channel. Anyone with
                        this link will be able to see all messages in the
                        channel, forever, so share it carefully. (Clicking the link effectively gives the Zbay website the key, too. This is not ideal and will be fixed in an upcoming release.)
                      </Typography>
                    </Grid>
                  )}
                </Grid>
                <Grid container item className={classes.addressBox}>
                  <Grid item>
                    <Typography variant='body2' className={classes.description}>
                      {address}
                    </Typography>
                  </Grid>
                  <Grid>
                    <CopyToClipboard text={address}>
                      <Button className={classes.copyButton}>
                        Copy to clipboard
                      </Button>
                    </CopyToClipboard>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Scrollbars>
        )}
      </AutoSizer>
    </Modal>
  )
}

export default ChannelInfoModal
