import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'
import { Typography } from '@material-ui/core'
import Button from '@material-ui/core/Button'

import BasicMessage from './BasicMessage'
import { _DisplayableMessage } from '../../../zbay/messages'

const reqSvgs = require && require.context('../../ui/assets/backgrounds', true, /\.svg$/)

const styles = theme => ({
  root: {
    marginTop: -20,
    marginLeft: 52,
    position: 'relative',
    backgroundColor: theme.palette.colors.white,
    width: 256,
    height: 274,
    borderRadius: 4,
    border: `1px solid ${theme.palette.colors.inputGray}`
  },
  contentContainer: {
    position: 'absolute',
    padding: '0px 20px',
    top: 144,
    width: 256,
    height: 130
  },
  backgroundImage: {
    position: 'absolute',
    top: -1,
    left: -1,
    width: 256,
    height: 144,
    backgroundColor: 'yellow',
    borderTopRightRadius: 4,
    borderTopLeftRadius: 4
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
  description: {
    color: theme.palette.colors.darkGray
  },
  button: {
    minWidth: 42,
    height: 24,
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
    border: `1px solid ${theme.palette.colors.trueBlack}`
  },
  buttonString: {
    fontWeight: 500,
    fontSize: 11,
    lineHeight: '10px'
  },
  actionContainer: {
    position: 'absolute',
    padding: '0px 20px',
    top: 230
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
  }
})

export const ListingMessage = ({ message, classes, handleBuy, payload, buyActions }) => {
  const [actionsOpen, setActionsOpen] = React.useState(false)
  const inputWidth = 50 + payload.tag.length * 15
  const { tag, description, background, title, priceUSD, priceZcash } = payload
  return (
    <BasicMessage message={message} actionsOpen={actionsOpen} setActionsOpen={setActionsOpen}>
      <Grid
        className={classes.root}
        justify={'flex-start'}
        alignItems={'center'}
        direction={'column'}
        container
        onClick={() => buyActions('advertActions', payload)}
      >
        <Grid
          container
          item
          className={classes.backgroundImage}
          style={{ background: `url(${reqSvgs(reqSvgs.keys()[background])})` }}
          justify={'center'}
          alignItems={'center'}
        >
          <Grid
            container
            item
            className={classes.tagContainer}
            style={{ width: inputWidth }}
            justify={'center'}
            alignItems={'center'}
          >
            <Typography variant={'h1'} className={classes.tag}>
              <span className={classes.hash}>#</span>
              {tag}
            </Typography>
          </Grid>
        </Grid>
        <Grid
          container
          direction={'column'}
          className={classes.contentContainer}
          item
          justify={'flex-start'}
        >
          <Grid container item>
            <Typography variant={'body2'} className={classes.title}>
              {title.length > 20 ? `${title.substring(0, 20)}...` : title}
            </Typography>
          </Grid>
          <Grid container item>
            <Typography variant={'caption'} className={classes.description}>
              {description.length > 50 ? `${description.substring(0, 50)}...` : description}
            </Typography>
          </Grid>
        </Grid>
        <Grid
          container
          direction={'row'}
          className={classes.actionContainer}
          wrap={'nowrap'}
          item
          justify={'flex-start'}
        >
          <Grid item>
            <Button onClick={handleBuy} className={classes.button}>
              <span className={classes.buttonString}>BUY</span>
            </Button>
          </Grid>
          <Grid item>
            <Typography variant={'caption'} className={classes.priceUsd}>
              ${priceUSD}
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant={'caption'} className={classes.priceZcash}>
              ({`${priceZcash} ZEC`})
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </BasicMessage>
  )
}

ListingMessage.propTypes = {
  classes: PropTypes.object.isRequired,
  payload: PropTypes.shape({
    tag: PropTypes.string.isRequired,
    priceUSD: PropTypes.string.isRequired,
    priceZcash: PropTypes.string.isRequired,
    offerOwner: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired
  }),
  handleBuy: PropTypes.func.isRequired,
  buyActions: PropTypes.func.isRequired,
  message: PropTypes.instanceOf(_DisplayableMessage).isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(ListingMessage)
