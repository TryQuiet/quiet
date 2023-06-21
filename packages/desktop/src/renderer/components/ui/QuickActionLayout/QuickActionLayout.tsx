import React, { ReactElement } from 'react'

import { styled } from '@mui/material/styles'

import ClearIcon from '@mui/icons-material/Clear'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'

import IconButton from '../Icon/IconButton'
import { IconButtonProps } from '@mui/material/IconButton'

const PREFIX = 'QuickActionLayout'

const classes = {
  alignAvatarPopover: `${PREFIX}alignAvatarPopover`,
  button: `${PREFIX}button`,
  container: `${PREFIX}container`,
  usernamePopover: `${PREFIX}usernamePopover`,
  closeIcon: `${PREFIX}closeIcon`,
  info: `${PREFIX}info`,
  infoDiv: `${PREFIX}infoDiv`,
  avatar: `${PREFIX}avatar`,
}

const StyledGrid = styled(Grid)(({ theme }) => ({
  [`& .${classes.alignAvatarPopover}`]: {
    marginTop: theme.spacing(2),
  },

  [`& .${classes.button}`]: {
    marginTop: theme.spacing(3),
    width: 260,
    height: 60,
    paddingTop: theme.spacing(1.2),
    paddingBottom: theme.spacing(1.2),
    paddingLeft: theme.spacing(1.6),
    paddingRight: theme.spacing(1.6),
    color: theme.palette.colors.white,
    fontSize: '0.9rem',
    backgroundColor: theme.palette.colors.purple,
    textTransform: 'none',
  },

  [`&.${classes.container}`]: {
    height: 400,
    width: 320,
  },

  [`& .${classes.usernamePopover}`]: {
    marginTop: theme.spacing(1),
    fontSize: '1.2rem',
    fontWeight: 'bold',
  },

  [`& .${classes.closeIcon}`]: {
    margin: theme.spacing(2),
  },

  [`& .${classes.info}`]: {
    color: theme.palette.colors.quietBlue,
  },

  [`& .${classes.infoDiv}`]: {
    textAlign: 'center',
    marginTop: theme.spacing(1.2),
    marginLeft: theme.spacing(4),
    marginRight: theme.spacing(4),
  },

  [`& .${classes.avatar}`]: {
    marginTop: theme.spacing(2),
  },
}))

interface QuickActionLayoutProps {
  main: string
  info?: string
  children?: ReactElement
  handleClose: IconButtonProps['onClick']
  buttonName?: string
  warning?: string
  onClick?: () => void
}

export const QuickActionLayout: React.FC<QuickActionLayoutProps> = ({
  main,
  info,
  children,
  handleClose,
  buttonName,
  warning,
  onClick,
}) => {
  return (
    <StyledGrid
      container
      className={classes.container}
      direction='column'
      justifyContent='flex-start'
      alignItems='center'
    >
      <Grid className={classes.closeIcon} container item direction='row' justifyContent='flex-start'>
        <IconButton onClick={handleClose}>
          <ClearIcon />
        </IconButton>
      </Grid>
      <Grid item className={classes.avatar}>
        <span className={classes.alignAvatarPopover}>{children}</span>
      </Grid>
      <Grid item>
        <Typography color='textPrimary' className={classes.usernamePopover}>
          {main}
        </Typography>
      </Grid>
      <Grid item>
        <Typography className={classes.info} variant='caption'>
          {info}
        </Typography>
      </Grid>
      <Grid item>
        <Button variant={'contained'} onClick={onClick} disabled={!!warning} className={classes.button}>
          {buttonName}
        </Button>
      </Grid>
      <Grid item className={classes.infoDiv}>
        <Typography className={classes.info} variant='caption'>
          {warning}
        </Typography>
      </Grid>
    </StyledGrid>
  )
}

export default QuickActionLayout
