import React from 'react'
import classNames from 'classnames'

import { styled, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'

import { createLogger } from '../../../logger'
import ChannelTypeIcon from './ChannelTypeIcon'

const PREFIX = 'ChannelHeaderComponent'

const classes = {
  root: `${PREFIX}root`,
  title: `${PREFIX}title`,
  actions: `${PREFIX}actions`,
  switch: `${PREFIX}switch`,
  tabs: `${PREFIX}tabs`,
  selected: `${PREFIX}selected`,
  indicator: `${PREFIX}indicator`,
  descriptionDiv: `${PREFIX}descriptionDiv`,
  wrapper: `${PREFIX}wrapper`,
  iconDiv: `${PREFIX}iconDiv`,
  iconButton: `${PREFIX}iconButton`,
  bold: `${PREFIX}bold`,
  menu: `${PREFIX}menu`,
  lock: `${PREFIX}lock`,
}

const Root = styled('div')(({ theme }) => ({
  // 'Panel title bar / Type=Channel' (library 3526:11541): padding 20/16 around a title block, hairline #F0F0F0.
  // 16 + (24 + 20) + 16 on the token line-heights = 76; the kebab keeps 20 from the edge (12 + its own 8).
  [`& .${classes.root}`]: {
    height: 76,
    paddingLeft: 20,
    paddingRight: theme.space.md,
    borderBottom: `1px solid ${theme.palette.colors.border01}`,
  },

  [`& .${classes.title}`]: {},

  [`& .${classes.actions}`]: {},

  [`& .${classes.switch}`]: {
    maxWidth: 138,
    marginRight: 18,
    borderRadius: 4,
    borderStyle: 'solid',
    borderColor: theme.palette.colors.gray03,
  },

  [`& .${classes.tabs}`]: {
    minHeight: 0,
  },

  [`& .${classes.indicator}`]: {
    maxHeight: 0,
  },

  [`& .${classes.descriptionDiv}`]: {
    top: 75,
    padding: '12px 25px 12px 20px',
    backgroundColor: theme.palette.background.default,
    boxShadow: theme.shadows[2],
  },

  [`&.${classes.wrapper}`]: {},

  [`& .${classes.iconDiv}`]: {
    marginLeft: 12,
  },

  [`& .${classes.iconButton}`]: {
    padding: 0,
  },

  [`& .${classes.bold}`]: {
    fontWeight: 500,
  },

  // Hover for the kebab: the library's icon hover is a #F0F0F0 (border01) round tint (4873:18663).
  [`& .${classes.menu}`]: {
    display: 'flex',
    padding: theme.space.sm,
    borderRadius: 16,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.colors.border01,
    },
  },

  [`& .${classes.lock}`]: {
    marginRight: -2,
    marginLeft: -2,
  },
}))

export interface ChannelHeaderProps {
  channelName: string
  isPublic: boolean
  openContextMenu?: () => void
  enableContextMenu: boolean
}

const logger = createLogger('channels:ChannelHeader')

export const ChannelHeaderComponent: React.FC<ChannelHeaderProps> = ({
  channelName,
  isPublic,
  openContextMenu,
  enableContextMenu,
}) => {
  const theme = useTheme()
  const debounce = (fn: () => void, ms: number) => {
    let timer: ReturnType<typeof setTimeout> | null
    return (_: any) => {
      if (timer) {
        clearTimeout(timer)
      }
      timer = setTimeout(() => {
        timer = null
        fn.apply(this)
      }, ms)
    }
  }

  const [wrapperWidth, setWrapperWidth] = React.useState(0)

  React.useEffect(() => {
    setWrapperWidth(window.innerWidth - 300)
  })

  React.useEffect((): any => {
    const handleResize = debounce(function handleResize() {
      setWrapperWidth(window.innerWidth - 300)
    }, 200)

    window.addEventListener('resize', handleResize)

    return window.removeEventListener('resize', handleResize)
  })

  const channelNameTruncated = channelName?.substring(0, 20)

  return (
    <Root className={classes.wrapper}>
      <Grid container className={classes.root} justifyContent='space-between' alignItems='center' direction='row'>
        <Grid item>
          <Grid item container alignItems='center'>
            <Grid item>
              <Grid container justifyContent='space-between' alignItems='center' direction='row' gap='2px'>
                <ChannelTypeIcon
                  isPublic={isPublic}
                  fill={'currentColor'}
                  style={{ ...theme.typography.h5 }}
                  className={classNames({
                    [classes.title]: true,
                    [classes.bold]: true,
                    [classes.lock]: true,
                  })}
                  data-testid={`channelTitle-icon-${isPublic ? 'public' : 'private'}`}
                />
                <Typography
                  noWrap
                  style={{ maxWidth: wrapperWidth }}
                  variant='h5'
                  className={classNames({
                    [classes.title]: true,
                    [classes.bold]: true,
                  })}
                  data-testid={'channelTitle'}
                >
                  {channelNameTruncated}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        <Grid
          item
          xs
          container
          className={classes.actions}
          justifyContent='flex-end'
          alignContent='center'
          alignItems='center'
        >
          {enableContextMenu && (
            <Grid item className={classes.menu} onClick={openContextMenu} data-testid={'channelContextMenuButton'}>
              <MoreHorizIcon />
            </Grid>
          )}
        </Grid>
      </Grid>
    </Root>
  )
}

export default ChannelHeaderComponent
