import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { AutoSizer } from 'react-virtualized'
import { Scrollbars } from 'react-custom-scrollbars'
import { DateTime } from 'luxon'

import Grid from '@material-ui/core/Grid'
import Button from '@material-ui/core/Button'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'
import Jdenticon from 'react-jdenticon'

import { getTimeFormat } from '../../widgets/channels/BasicMessage'
import Modal from '../Modal'

const reqSvgs = require && require.context('../assets/backgrounds', true, /\.svg$/)

const sendFounds = (handleClose, onSendFoundsAction, payload) => {
  handleClose()
  onSendFoundsAction('advertSendFounds', payload)
}

const styles = theme => ({
  window: {
    width: 600,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)'
  },
  main: {
    marginTop: 20,
    padding: '0px 20px'
  },
  backgroundImage: {
    width: '100%',
    height: 225,
    backgroundColor: 'yellow',
    borderRadius: 4
  },
  tagContainer: {
    width: 156,
    height: 46,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 4
  },
  tag: {
    color: theme.palette.colors.white,
    fontSize: 28,
    lineHeight: '34px',
    fontWeight: 500
  },
  hash: {
    opacity: 0.6
  },
  title: {
    marginTop: 16,
    fontWeight: 500,
    color: theme.palette.colors.titleGray
  },
  descriptionContainer: {
    marginTop: 10,
    lineHeight: '18px'
  },
  description: {
    letterSpacing: 0.4,
    lineHeight: '18px',
    color: theme.palette.colors.darkGray
  },
  priceUsd: {
    color: theme.palette.colors.trueBlack,
    fontSize: 13,
    lineHeight: '24px',
    letterSpacing: 0.4
  },
  priceZcash: {
    marginLeft: 3,
    color: theme.palette.colors.darkGray,
    fontSize: 13,
    lineHeight: '24px',
    letterSpacing: 0.4
  },
  priceContainer: {},
  actionsContainer: {
    marginTop: 10,
    padding: '0px 20px'
  },
  buttonMessage: {
    backgroundColor: 'transparent',
    color: theme.palette.colors.purple,
    borderColor: theme.palette.colors.purple,
    textTransform: 'none',
    fontWeight: 'normal'
  },
  buttonString: {
    fontStyle: 'normal',
    fontWeight: 'normal',
    fontSize: 14,
    lineHeight: '10px',
    color: 'rgba(0, 0, 0, 0.35)'
  },
  user: {
    height: 64,
    padding: '5px 20px',
    borderBottom: `1px solid ${theme.palette.colors.veryLightGray}`
  },
  userInfoDiv: {
    marginLeft: 10
  },
  userInfo: {
    fontSize: 12,
    color: theme.palette.colors.darkGray
  },
  alignAvatar: {
    marginTop: 4,
    marginLeft: -5
  },
  username: {},
  bottomInfo: {
    height: 64,
    padding: '8px 20px',
    borderTop: `1px solid ${theme.palette.colors.veryLightGray}`
  },
  bottomHashtag: {
    color: theme.palette.colors.darkGray
  },
  buyButton: {
    backgroundColor: theme.palette.colors.greenDark,
    color: theme.palette.colors.white,
    textTransform: 'none',
    fontWeight: 'normal',
    padding: 0,
    minWidth: 0,
    width: '100%',
    height: '100%',
    fontSize: 12
  },
  buyButtonDiv: {
    width: 49,
    height: 32
  }
})

export const AdvertActionModal = ({
  classes,
  open,
  payload,
  handleBuy,
  handleClose,
  handleMessage,
  updateTimestamp,
  history,
  onSendFoundsAction
}) => {
  const time = DateTime.fromSeconds(parseInt(payload.createdAt))
  const timeFormat = getTimeFormat(time)
  const timeString = time.toFormat(timeFormat)

  return payload ? (
    <Modal
      open={open}
      handleClose={handleClose}
      classes={{ window: classes.window }}
      title={`#${payload.tag} @${payload.offerOwner.substring(0, 20)}`}
      isBold
      fullPage
      alignCloseLeft
    >
      <Grid container direction='column'>
        <Grid
          item
          container
          direction='row'
          justify={'space-between'}
          alignItems={'center'}
          className={classes.user}
        >
          <Grid item xs container direction='row' alignItems='center'>
            <Grid item className={classes.alignAvatar}>
              <Jdenticon size='50' value={payload.offerOwner} />
            </Grid>
            <Grid item className={classes.userInfoDiv}>
              <Grid container direction='column'>
                <Grid item>
                  <Typography variant='h4' className={classes.username}>
                    {payload.offerOwner.substring(0, 20)}
                  </Typography>
                </Grid>
                <Grid item>
                  <Typography variant='caption' className={classes.userInfo}>
                    Seller
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <Grid item>
            <Button
              variant='outlined'
              className={classes.buttonMessage}
              onClick={() => {
                handleMessage({ payload, history })
                handleClose()
              }}
            >
              Message
            </Button>
          </Grid>
        </Grid>
        <Grid item xs>
          <AutoSizer>
            {({ width, height }) => (
              <Scrollbars autoHideTimeout={500} style={{ width: width, height: height }}>
                <Grid
                  container
                  dirention={'column'}
                  justify={'center'}
                  alignContent={'flex-start'}
                  className={classes.main}
                >
                  <Grid
                    container
                    className={classes.backgroundImage}
                    style={{ background: `url(${reqSvgs(reqSvgs.keys()[payload.background])})` }}
                    item
                    justify={'center'}
                    alignItems={'center'}
                  >
                    <Grid
                      container
                      item
                      className={classes.tagContainer}
                      style={{ width: 50 + payload.tag.length * 15 }}
                      justify={'center'}
                      alignItems={'center'}
                    >
                      <Typography variant={'h1'} className={classes.tag}>
                        <span className={classes.hash}>#</span>
                        {payload.tag}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Grid container item>
                    <Typography variant={'body2'} className={classes.title}>
                      {payload.title}
                    </Typography>
                  </Grid>
                  <Grid container direction='column' className={classes.descriptionContainer} item>
                    <Grid item>
                      <Typography variant={'caption'} className={classes.description}>
                        {payload.description}
                      </Typography>
                    </Grid>
                    <Grid item>
                      <Typography variant={'caption'} className={classes.description}>
                        {`Posted: ${timeString}`}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Scrollbars>
            )}
          </AutoSizer>
        </Grid>
        <Grid item className={classes.bottomInfo}>
          <Grid container justify='space-between' alignItems='center'>
            <Grid item xs>
              <Typography variant='body1' className={classes.bottomHashtag}>
                #{payload.tag}
              </Typography>
              <Grid
                container
                direction={'row'}
                className={classes.priceContainer}
                wrap={'nowrap'}
                item
                justify={'flex-start'}
              >
                <Grid item>
                  <Typography variant={'caption'} className={classes.priceUsd}>
                    ${payload.priceUSD}
                  </Typography>
                </Grid>
                <Grid item>
                  <Typography variant={'caption'} className={classes.priceZcash}>
                    ({`${payload.priceZcash} ZEC`})
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
            <Grid item className={classes.buyButtonDiv}>
              <Button
                variant='text'
                className={classes.buyButton}
                onClick={() => sendFounds(handleClose, onSendFoundsAction, payload)}
              >
                Buy
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Modal>
  ) : null
}

AdvertActionModal.propTypes = {
  classes: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  payload: PropTypes.shape({
    tag: PropTypes.string.isRequired,
    priceUSD: PropTypes.string.isRequired,
    priceZcash: PropTypes.string.isRequired,
    offerOwner: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    background: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    createdAt: PropTypes.number.isRequired
  }),
  handleMessage: PropTypes.func.isRequired,
  handleClose: PropTypes.func.isRequired
}

AdvertActionModal.defaultProps = {
  payload: {
    tag: '',
    priceUSD: '',
    priceZcash: '',
    offerOwner: '',
    description: '',
    title: '',
    background: '1',
    id: '',
    createdAt: 0
  }
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(AdvertActionModal)
