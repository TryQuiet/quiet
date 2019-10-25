import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { AutoSizer } from 'react-virtualized'
import { Scrollbars } from 'react-custom-scrollbars'

import Grid from '@material-ui/core/Grid'
import Button from '@material-ui/core/Button'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'

import Modal from '../Modal'

const styles = theme => ({
  window: {
    width: 570,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)'
  },
  main: {
    marginTop: 32,
    padding: '0px 32px'
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
    marginTop: 10
  },
  description: {
    letterSpacing: 0.4,
    color: theme.palette.colors.darkGray
  },
  priceUsd: {
    marginLeft: 9,
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
  priceContainer: {
    marginTop: 10,
    padding: '0px 20px'
  },
  actionsContainer: {
    marginTop: 10,
    padding: '0px 20px'
  },
  button: {
    textTransform: 'none',
    marginRight: 12,
    minWidth: 126,
    height: 31,
    padding: 0,
    margin: 0,
    backgroundColor: theme.palette.colors.buttonGray
  },
  buttonString: {
    fontStyle: 'normal',
    fontWeight: 'normal',
    fontSize: 14,
    lineHeight: '10px',
    color: 'rgba(0, 0, 0, 0.35)'
  }
})

export const AdvertActionModal = ({
  classes,
  open,
  payload,
  handleBuy,
  handleClose,
  handleMessage
}) => (
  payload ? <Modal
    open={open}
    handleClose={handleClose}
    classes={{ window: classes.window }}
    title={`#${payload.tag} @${payload.offerOwner}`}
    fullPage
  >
    <AutoSizer>
      {({ width, height }) => (
        <Scrollbars autoHideTimeout={500} style={{ width: width, height: height }}>
          <Grid container dirention={'column'} justify={'center'} alignContent={'flex-start'} className={classes.main}>
            <Grid container className={classes.backgroundImage} style={{ background: `url(${payload.background})` }} item justify={'center'} alignContent={'center'}>
              <Grid container item className={classes.tagContainer} style={{ width: 30 + payload.tag.length * 15 }} justify={'center'} alignItems={'center'}>
                <Typography variant={'h1'} className={classes.tag}><span className={classes.hash}>#</span>{payload.tag}</Typography>
              </Grid>
            </Grid>
            <Grid container item>
              <Typography variant={'body2'} className={classes.title}>{payload.title}</Typography>
            </Grid>
            <Grid container className={classes.descriptionContainer} item>
              <Typography variant={'caption'} className={classes.description}>{payload.description}</Typography>
            </Grid>
          </Grid>
          <Grid container direction={'row'} className={classes.priceContainer} wrap={'nowrap'} item justify={'flex-start'}>
            <Grid item>
              <Typography variant={'caption'} className={classes.priceUsd}>${payload.priceUSD}</Typography>
            </Grid>
            <Grid item>
              <Typography variant={'caption'} className={classes.priceZcash}>({`${payload.priceZcash} ZEC`})</Typography>
            </Grid>
          </Grid>
          <Grid container direction={'row'} className={classes.actionsContainer} wrap={'nowrap'} item justify={'flex-start'}>
            <Grid item>
              <Button onClick={handleMessage} className={classes.button}><span className={classes.buttonString}>Message Seller</span></Button>
            </Grid>
            <Grid item>
              <Button onClick={handleBuy} className={classes.button}><span className={classes.buttonString}>Buy Now</span></Button>
            </Grid>
          </Grid>
        </Scrollbars>
      )}
    </AutoSizer>
  </Modal>
    : null
)

AdvertActionModal.propTypes = {
  classes: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  payload: PropTypes.shape({
    tag: PropTypes.string.isRequired,
    priceUSD: PropTypes.string.isRequired,
    priceZcash: PropTypes.string.isRequired,
    offerOwner: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired
  }),
  handleBuy: PropTypes.func.isRequired,
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
    title: ''
  }
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(AdvertActionModal)
