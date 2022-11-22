import React, { ReactElement } from 'react'

import ClearIcon from '@mui/icons-material/Clear'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import { makeStyles } from '@mui/material/styles'

import IconButton from '../Icon/IconButton'

const useStyles = makeStyles(theme => ({
  alignAvatarPopover: {
    marginTop: theme.spacing(2)
  },
  button: {
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
    textTransform: 'none'
  },
  container: {
    height: 400,
    width: 320
  },
  usernamePopover: {
    marginTop: theme.spacing(1),
    fontSize: '1.2rem',
    fontWeight: 'bold'
  },
  closeIcon: {
    margin: theme.spacing(2)
  },
  info: {
    color: theme.palette.colors.quietBlue
  },
  infoDiv: {
    textAlign: 'center',
    marginTop: theme.spacing(1.2),
    marginLeft: theme.spacing(4),
    marginRight: theme.spacing(4)
  },
  avatar: {
    marginTop: theme.spacing(2)
  }
}))

interface QuickActionLayoutProps {
  main: string
  info?: string
  children?: ReactElement
  handleClose: (event?: {}, reason?: 'backdropClick' | 'escapeKeyDown') => void
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
  onClick
}) => {
  const classes = useStyles({})
  return (
    <Grid
      container
      className={classes.container}
      direction='column'
      justify='flex-start'
      alignItems='center'>
      <Grid className={classes.closeIcon} container item direction='row' justify='flex-start'>
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
        <Button
          variant={'contained'}
          onClick={onClick}
          disabled={!!warning}
          className={classes.button}>
          {buttonName}
        </Button>
      </Grid>
      <Grid item className={classes.infoDiv}>
        <Typography className={classes.info} variant='caption'>
          {warning}
        </Typography>
      </Grid>
    </Grid>
  )
}

export default QuickActionLayout
