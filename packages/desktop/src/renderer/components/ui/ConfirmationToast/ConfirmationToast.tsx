import React from 'react'
import { styled } from '@mui/material/styles'
import Snackbar from '@mui/material/Snackbar'
import Typography from '@mui/material/Typography'
import CheckIcon from '@mui/icons-material/Check'

const PREFIX = 'ConfirmationToast'

const classes = {
  box: `${PREFIX}box`,
  icon: `${PREFIX}icon`,
}

/**
 * The design's confirmation toast — the library's Alert (Device-linking file 879:15652,
 * "Removed" / "Linked"): a 180×84 box, r16, padded 16, #222222, a white check over the
 * message at 14/20 500 white, centred. Mobile's ConfirmationBox is the same box.
 */
const Box = styled('div')(({ theme }) => ({
  boxSizing: 'border-box',
  width: 180,
  height: 84,
  padding: theme.space.lg,
  borderRadius: 16,
  backgroundColor: '#222222',
  color: theme.palette.colors.white,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.space.sm,
  [`& .${classes.icon}`]: {
    width: 24,
    height: 24,
  },
}))

export interface ConfirmationToastProps {
  open: boolean
  message: string
  onClose: () => void
  /** How long it stays, ms (mobile's ConfirmationBox: 2000). */
  duration?: number
  'data-testid'?: string
}

export const ConfirmationToast: React.FC<ConfirmationToastProps> = ({
  open,
  message,
  onClose,
  duration = 2000,
  'data-testid': dataTestId = 'confirmation-toast',
}) => (
  <Snackbar
    open={open}
    autoHideDuration={duration}
    onClose={onClose}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    data-testid={dataTestId}
  >
    <Box role='status' className={classes.box}>
      <CheckIcon className={classes.icon} aria-hidden />
      <Typography variant='subtitle2' component='div' color='inherit'>
        {message}
      </Typography>
    </Box>
  </Snackbar>
)

export default ConfirmationToast
