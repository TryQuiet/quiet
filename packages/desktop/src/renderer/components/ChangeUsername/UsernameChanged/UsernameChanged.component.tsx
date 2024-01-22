import React from 'react'

import { styled } from '@mui/material/styles'
import classNames from 'classnames'

import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

import LoadingButton from '../../ui/LoadingButton/LoadingButton'

const PREFIX = 'UsernameChanged-'

const classes = {
  button: `${PREFIX}button`,
  marginMedium: `${PREFIX}marginMedium`,
}

const StyledGrid = styled(Grid)(({ theme }) => ({
  backgroundColor: theme.palette.colors.white,
  padding: '0px 32px',

  [`& .${classes.button}`]: {
    width: 110,
    height: 48,
    textTransform: 'none',
    fontWeight: 'normal',
    color: theme.palette.colors.white,
    backgroundColor: theme.palette.colors.quietBlue,
    '&:hover': {
      backgroundColor: theme.palette.colors.quietBlue,
    },
    borderRadius: 8,
  },

  [`& .${classes.marginMedium}`]: {
    marginTop: 24,
  },
}))

interface UsernameChangedProps {
  handleClose: () => void
}

export const UsernameChanged: React.FC<UsernameChangedProps> = ({ handleClose }) => {
  return (
    <StyledGrid>
      <Typography variant='body2' className={classes.marginMedium}>
        Great! Your new username should be registered automatically the next time the community owner is online.
      </Typography>
      <LoadingButton
        variant='contained'
        color='primary'
        type='submit'
        text={'Continue'}
        onClick={handleClose}
        classes={{
          button: classNames({
            [classes.button]: true,
            [classes.marginMedium]: true,
          }),
        }}
      />
    </StyledGrid>
  )
}

export default UsernameChanged
