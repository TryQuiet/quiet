import React from 'react'
import classNames from 'classnames'

import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import { makeStyles } from '@mui/material/styles'

import zbayLogo from '../../../static/images/zcash/zbay-square-logo.svg'
import Icon from '../../ui/Icon/Icon'

import { IWelcomeMessageProps } from './WelcomeMessage.d'

const useStyles = makeStyles((theme) => ({
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
  },
  time: {
    color: theme.palette.colors.lightGray,
    fontSize: 14,
    marginTop: -4,
    marginRight: 5
  }
}))

export const WelcomeMessage: React.FC<IWelcomeMessageProps> = ({
  message,
  timestamp
}) => {
  const classes = useStyles({})
  const username = 'Quiet'
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
            direction="row"
            justify="flex-start"
            alignItems="flex-start"
            wrap={'nowrap'}
          >
            <Grid item className={classes.avatar}>
              <Icon className={classes.icon} src={zbayLogo} />
            </Grid>
            <Grid container item direction="row" justify="space-between">
              <Grid container item xs alignItems="flex-start" wrap="nowrap">
                <Grid item>
                  <Typography color="textPrimary" className={classes.username}>
                    {username}
                  </Typography>
                </Grid>
                {!!timestamp && (
                  <Grid item>
                    <Typography className={classes.time}>{timestamp}</Typography>
                  </Grid>
                )}
              </Grid>
            </Grid>
          </Grid>
        }
        secondary={
          <Grid className={classes.messageInput} item>
            <Typography variant="body2" className={classes.message}>
              {message}
            </Typography>
          </Grid>
        }
      />
    </ListItem>
  )
}

WelcomeMessage.defaultProps = {
  timestamp: '0'
}

export default WelcomeMessage
