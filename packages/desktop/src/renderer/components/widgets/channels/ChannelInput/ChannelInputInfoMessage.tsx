import React from 'react'
import { styled } from '@mui/material/styles'
import { Grid, Typography } from '@mui/material'
import { INPUT_STATE } from './InputState.enum'
import classNames from 'classnames'

const PREFIX = 'ChannelInputInfoMessage'

const classes = {
  info: `${PREFIX}info`,
  error: `${PREFIX}error`,
  bold: `${PREFIX}bold`,
  boot: `${PREFIX}boot`,
}

const StyledGrid = styled(Grid)(({ theme }) => ({
  [`& .${classes.info}`]: {
    color: theme.palette.colors.trueBlack,
    width: '100px',
    letterSpacing: '0.4px',
  },

  [`& .${classes.error}`]: {
    color: theme.palette.error.main,
    width: '100px',
    letterSpacing: '0.4px',
  },

  [`& .${classes.bold}`]: {
    fontWeight: 'bold',
  },

  [`&.${classes.boot}`]: {
    height: '24px',
    width: '100%',
    padding: '0px 20px',
  },
}))

interface ChannelInputInfoMessageProps {
  state: INPUT_STATE
  errorMessage?: string
}

const ChannelInputInfoMessage: React.FC<ChannelInputInfoMessageProps> = ({ state, errorMessage }) => {
  let infoMessage: string | undefined = undefined
  if (state === INPUT_STATE.NOT_CONNECTED) {
    infoMessage = 'Initializing community. This may take a few minutes...'
  } else if (errorMessage != null) {
    infoMessage = errorMessage
  }

  return (
    <StyledGrid container className={classes.boot} data-testid={'channel-input-info-message-container'}>
      <Grid item xs>
        {infoMessage != null && (
          <Typography
            variant='caption'
            className={classNames({
              [classes.info]: state === INPUT_STATE.NOT_CONNECTED,
              [classes.error]: errorMessage != null,
            })}
            data-testid={'channel-input-info-message'}
          >
            {infoMessage}
          </Typography>
        )}
      </Grid>
    </StyledGrid>
  )
}

export default ChannelInputInfoMessage
