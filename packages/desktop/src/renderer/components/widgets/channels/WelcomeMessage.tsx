import React from 'react'
import { styled } from '@mui/material/styles'
import classNames from 'classnames'

import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'

import zbayLogo from '../../../static/images/zcash/zbay-square-logo.svg'
import Icon from '../../ui/Icon/Icon'

import { IWelcomeMessageProps } from './WelcomeMessage.d'

const PREFIX = 'WelcomeMessage'

const classes = {
  messageCard: `${PREFIX}messageCard`,
  wrapper: `${PREFIX}wrapper`,
  username: `${PREFIX}username`,
  avatar: `${PREFIX}avatar`,
  message: `${PREFIX}message`,
  messageInput: `${PREFIX}messageInput`,
  icon: `${PREFIX}icon`,
  time: `${PREFIX}time`
}

const StyledListItem = styled(ListItem)((
  {
    theme
  }
) => ({
  [`& .${classes.messageCard}`]: {
    padding: 0
  },

  [`&.${classes.wrapper}`]: {
    backgroundColor: theme.palette.colors.white
  },

  [`& .${classes.username}`]: {
    fontSize: 16,
    fontWeight: 500,
    marginTop: -4,
    marginRight: 5
  },

  [`& .${classes.avatar}`]: {
    marginRight: 10
  },

  [`& .${classes.message}`]: {
    marginTop: 14,
    marginLeft: -4,
    whiteSpace: 'pre-line',
    wordBreak: 'break-word'
  },

  [`& .${classes.messageInput}`]: {
    marginTop: -35,
    marginLeft: 50
  },

  [`& .${classes.icon}`]: {
    width: 36,
    height: 36,
    borderRadius: 4
  },

  [`& .${classes.time}`]: {
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
  const username = 'Quiet'
  return (
    <StyledListItem
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
            justifyContent="flex-start"
            alignItems="flex-start"
            wrap={'nowrap'}
          >
            <Grid item className={classes.avatar}>
              <Icon className={classes.icon} src={zbayLogo} />
            </Grid>
            <Grid container item direction="row" justifyContent="space-between">
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
    </StyledListItem>
  )
}

WelcomeMessage.defaultProps = {
  timestamp: '0'
}

export default WelcomeMessage
