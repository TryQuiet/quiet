import React from 'react'
import Immutable from 'immutable'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import classNames from 'classnames'

import { withStyles } from '@material-ui/core/styles'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import { Typography, Grid } from '@material-ui/core'

const styles = theme => ({
  root: {
    padding: 0
  },
  selected: {
    backgroundColor: theme.palette.colors.lushSky,
    '&:hover': {
      backgroundColor: theme.palette.colors.lushSky
    }
  },
  badge: {
    padding: 6,
    top: '50%',
    right: theme.spacing(-3),
    fontSize: 10,
    background: 'rgb(0,0,0,0.3)',
    color: '#fff'
  },
  primary: {
    display: 'flex'
  },
  title: {
    opacity: 0.7,
    paddingLeft: 16,
    paddingRight: 16,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 230,
    whiteSpace: 'nowrap'
  },
  newMessages: {
    opacity: 1
  },
  icon: {
    marginTop: 6,
    fill: theme.palette.colors.green
  },
  itemText: {
    margin: 0
  },
  nameSpacing: {
    marginLeft: 4
  }
})

export const OfferListItem = ({ classes, channel, history, selected }) => {
  const channelObj = channel.toJS()
  const highlight = channelObj.itemId === selected.id
  const newMessages = channelObj.newMessages.length
  return (
    <ListItem
      button
      disableGutters
      onClick={() => {
        history.push(`/main/offers/${channelObj.itemId}/${channelObj.address}`)
      }}
      className={classNames(classes.root, {
        [classes.selected]: highlight
      })}
    >
      <ListItemText
        primary={
          <Grid container alignItems='center'>
            <Grid item>
              <Typography
                variant='body2'
                className={classNames(classes.title, {
                  [classes.newMessages]: newMessages
                })}
              >
                {`# ${channelObj.name}`}
              </Typography>
            </Grid>
          </Grid>
        }
        classes={{
          primary: classes.primary
        }}
        className={classes.itemText}
      />
    </ListItem>
  )
}
OfferListItem.propTypes = {
  classes: PropTypes.object.isRequired,
  channel: PropTypes.oneOfType([
    PropTypes.instanceOf(Immutable.Map),
    PropTypes.instanceOf(Immutable.Record)
  ]).isRequired,
  selected: PropTypes.instanceOf(Immutable.Record).isRequired,
  history: PropTypes.object.isRequired
}

OfferListItem.defaultProps = {
  directMessages: false
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(OfferListItem)
