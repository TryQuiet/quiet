import React from 'react'
import { styled } from '@mui/material/styles'
import { Grid, Typography } from '@mui/material'

const PREFIX = 'ChannelInputInfoMessage'

const classes = {
  info: `${PREFIX}info`,
  bold: `${PREFIX}bold`,
  boot: `${PREFIX}boot`,
}

const StyledGrid = styled(Grid)(({ theme }) => ({
  [`& .${classes.info}`]: {
    color: theme.palette.colors.trueBlack,
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
  showInfoMessage: boolean
}

const ChannelInputInfoMessage: React.FC<ChannelInputInfoMessageProps> = ({ showInfoMessage }) => {
  return (
    <StyledGrid container className={classes.boot}>
      <Grid item xs>
        {showInfoMessage && (
          <Typography variant='caption' className={classes.info}>
            Initializing community. This may take a few minutes...
          </Typography>
        )}
      </Grid>
    </StyledGrid>
  )
}

export default ChannelInputInfoMessage
