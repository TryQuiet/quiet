import React, { FC } from 'react'

import QR from 'react-qr-code'

import { styled } from '@mui/material/styles'

import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

import { QR_BOX_SIZE, QR_SIZE } from '../../../Onboarding/DisplayQrCodeComponent'

const PREFIX = 'QRCode'

const classes = {
  centred: `${PREFIX}centred`,
  codeWrapper: `${PREFIX}codeWrapper`,
  textWrapper: `${PREFIX}textWrapper`,
  text: `${PREFIX}text`,
}

/**
 * Settings → QR code, drawn as the prototype's `Add members — QR code` sheet (2932:3707): the
 * code centred on the panel in the library's `qr-code-box`, the sentence centred beneath it. The
 * panel used to stack both against the left edge, which left the code floating in the drawer's
 * 375 column. The sheet's own actions (`Share code`, `Reset QR code`) are not drawn here — this
 * panel has never had either, and neither is wired.
 *
 * The box geometry is the one `DisplayQrCodeComponent` already draws for Link devices, imported
 * rather than repeated so the two QR surfaces cannot drift apart.
 */
const StyledGrid = styled(Grid)(({ theme }) => ({
  [`& .${classes.centred}`]: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.space.lg,
  },

  /**
   * A QR code is drawn in black on transparent, so on the dark theme's #222222 it is black on
   * near-black. It carries its own white ground — with a quiet zone, which a scanner needs to find
   * the code's edges — rather than depending on the panel behind it.
   */
  [`& .${classes.codeWrapper}`]: {
    boxSizing: 'border-box',
    width: QR_BOX_SIZE,
    height: QR_BOX_SIZE,
    padding: (QR_BOX_SIZE - QR_SIZE) / 2 - 1,
    border: `1px solid ${theme.palette.colors.border02}`,
    borderRadius: theme.space.xs,
    backgroundColor: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  [`& .${classes.textWrapper}`]: {
    maxWidth: 340,
  },

  [`& .${classes.text}`]: {
    textAlign: 'center',
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
          <Typography variant='h5'>Only admins can invite new members</Typography>
        </Grid>
        <Grid item>
          <Typography variant='body2'>
            Only admins can invite new members to this community. Ask the community creator for a QR code to share.
          </Typography>
        </Grid>
      </StyledGrid>
    )
  }
  return (
    <StyledGrid container direction='column'>
      <Grid item className={classes.centred} data-testid='invitation-qr-code'>
        <Grid item className={classes.codeWrapper}>
          <QR value={value} size={QR_SIZE} />
        </Grid>
        <Grid item container direction='column' className={classes.textWrapper}>
          <Grid item>
            <Typography variant='h5' className={classes.text}>
              Invitation QR code
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant='body2' className={classes.text}>
              This community QR code is private. If it is shared with someone, they can scan it with their camera to
              join this community.
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </StyledGrid>
  )
}

export default QRCodeComponent
