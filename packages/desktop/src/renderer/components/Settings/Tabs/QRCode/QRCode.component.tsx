import React, { FC } from 'react'

import QR from 'react-qr-code'

import { styled } from '@mui/material/styles'

import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

const PREFIX = 'QRCode'

const classes = {
  codeWrapper: `${PREFIX}codeWrapper`,
  textWrapper: `${PREFIX}textWrapper`,
}

const StyledGrid = styled(Grid)(() => ({
  [`& .${classes.codeWrapper}`]: {
    marginTop: 16,
  },

  [`& .${classes.textWrapper}`]: {
    marginTop: 16,
    width: 340,
  },
}))

export interface QRCodeProps {
  value: string
}

export const QRCodeComponent: FC<QRCodeProps> = ({ value }) => {
  if (!value) {
    return (
      <StyledGrid container direction='column'>
        <Grid item>
          <Typography variant='body2' align='center'>
            Only admins can invite new members to this community. Ask the community creator for a QR code to share.
          </Typography>
        </Grid>
      </StyledGrid>
    )
  }
  return (
    <StyledGrid container direction='column' alignItems='center'>
      <Grid
        item
        className={classes.codeWrapper}
        sx={{ border: '1px solid', borderColor: 'divider', padding: 2, borderRadius: 1 }}
      >
        <QR value={value} size={172} style={{ display: 'block' }} />
      </Grid>
      <Grid item className={classes.textWrapper}>
        <Typography variant='body2' align='center'>
          This community QR code is private. If it is shared with someone, they can scan it with their camera to join
          this community.
        </Typography>
      </Grid>
    </StyledGrid>
  )
}

export default QRCodeComponent
