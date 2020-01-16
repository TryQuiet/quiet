import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import { withStyles } from '@material-ui/core/styles'

import zbayLogo from '../../../static/images/zcash/zbay-square-logo.svg'
import Icon from '../../ui/Icon'

const styles = theme => ({
  messageCard: {
    padding: 0
  },
  wrapper: {
    backgroundColor: theme.palette.colors.white
  },

  username: {
    fontSize: 16,
    fontWeight: 500,
    marginTop: -4,
    marginRight: 5
  },
  avatar: {
    marginRight: 10
  },
  message: {
    marginTop: 14,
    marginLeft: -4,
    whiteSpace: 'pre-line',
    wordBreak: 'break-word'
  },
  messageInput: {
    marginTop: -35,
    marginLeft: 50
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 4
  }
})

export const WelcomeMessage = ({ classes }) => {
  const username = 'Zbay'
  return (
    <ListItem
      className={classNames({
        [classes.wrapper]: true
      })}
    >
      <ListItemText
        disableTypography
        className={classes.messageCard}
        primary={
          <Grid
            container
            direction='row'
            justify='flex-start'
            alignItems='flex-start'
            wrap={'nowrap'}
          >
            <Grid item className={classes.avatar}>
              <Icon className={classes.icon} src={zbayLogo} />
            </Grid>
            <Grid container item direction='row' justify='space-between'>
              <Grid container item xs alignItems='flex-start' wrap='nowrap'>
                <Grid item>
                  <Typography color='textPrimary' className={classes.username}>
                    {username}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        }
        secondary={
          <Grid className={classes.messageInput} item>
            <Typography variant='body2' className={classes.message}>
              Congrats! You created a channel. You can make your channel public
              or share the channel link with others by accessing the “•••” menu
              at the top. You’ll also find a bunch of other settings. Have a
              great time!
            </Typography>
          </Grid>
        }
      />
    </ListItem>
  )
}

WelcomeMessage.propTypes = {
  classes: PropTypes.object.isRequired
}

export default R.compose(React.memo, withStyles(styles))(WelcomeMessage)
