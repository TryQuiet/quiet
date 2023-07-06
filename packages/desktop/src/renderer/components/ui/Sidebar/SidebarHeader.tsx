import React from 'react'
import { styled } from '@mui/material/styles'
import classNames from 'classnames'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import PlusIconWithBorder from '../Icon/PlusIconWithBorder'
import Tooltip from '../Tooltip/Tooltip'

const PREFIX = 'SidebarHeader'

const classes = {
  root: `${PREFIX}root`,
  title: `${PREFIX}title`,
  clickable: `${PREFIX}clickable`,
  iconButton: `${PREFIX}iconButton`,
  tooltip: `${PREFIX}tooltip`,
}

const StyledGrid = styled(Grid)(() => ({
  [`&.${classes.root}`]: {
    marginTop: 25,
    height: 32,
    paddingLeft: 16,
    paddingRight: 16,
  },

  [`& .${classes.title}`]: {
    opacity: 0.7,
    fontWeight: 500,
  },

  [`& .${classes.clickable}`]: {
    '&:hover': {
      backgroundColor: 'inherit',
      opacity: 1,
    },
    cursor: 'pointer',
  },

  [`& .${classes.iconButton}`]: {
    opacity: 0.7,
    '&:hover': {
      backgroundColor: 'inherit',
      opacity: 1,
    },
  },

  [`& .${classes.tooltip}`]: {
    marginTop: -1,
    backgroundColor: 'blue',
  },
}))

interface SidebarHeaderProps {
  title: string
  action: () => void
  actionTitle?: () => void
  tooltipText: string
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ title, action, actionTitle, tooltipText }) => {
  return (
    <StyledGrid container direction='row' justifyContent='space-between' alignItems='center' className={classes.root}>
      <Grid item>
        {actionTitle ? (
          <Typography variant='body2' className={classNames(classes.title)}>
            {title}
          </Typography>
        ) : (
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
            data-testid={'addChannelButton'}
            size='large'
          >
            <PlusIconWithBorder color='white' />
          </IconButton>
        </Tooltip>
      </Grid>
    </StyledGrid>
  )
}

export default SidebarHeader
