import React from 'react'
import classNames from 'classnames'
import { makeStyles } from '@mui/material'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import PlusIconWithBorder from '../Icon/PlusIconWithBorder'
import Tooltip from '../Tooltip/Tooltip'

const useStyles = makeStyles(() => ({
  root: {
    marginTop: 25,
    height: 32,
    paddingLeft: 16,
    paddingRight: 16
  },
  title: {
    opacity: 0.7,
    fontWeight: 500
  },
  clickable: {
    '&:hover': {
      backgroundColor: 'inherit',
      opacity: 1
    },
    cursor: 'pointer'
  },
  iconButton: {
    opacity: 0.7,
    '&:hover': {
      backgroundColor: 'inherit',
      opacity: 1
    }
  },
  tooltip: {
    marginTop: -1
  }
}))

interface SidebarHeaderProps {
  title: string
  action: () => void
  actionTitle?: () => void
  tooltipText: string
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  title,
  action,
  actionTitle,
  tooltipText
}) => {
  const classes = useStyles({})
  return (
    <Grid
      container
      direction='row'
      justify='space-between'
      alignItems='center'
      className={classes.root}>
      <Grid item>
        {actionTitle
          ? (
            <Typography
              variant='body2'
              className={classNames(classes.title)}
            >
              {title}
            </Typography>
          )
          : (
            <Typography variant='body2' className={classes.title}>
              {title}
            </Typography>
          )}
      </Grid>
      <Grid item>
        <Tooltip title={tooltipText} className={classes.tooltip} placement='bottom'>
          <IconButton
            className={classes.iconButton}
            onClick={event => {
              event.persist()
              action()
            }}
            edge='end'
            data-testid={'addChannelButton'}>
            <PlusIconWithBorder color='white' />
          </IconButton>
        </Tooltip>
      </Grid>
    </Grid>
  )
}

export default SidebarHeader
