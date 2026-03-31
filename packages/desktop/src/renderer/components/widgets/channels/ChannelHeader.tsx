import React from 'react'
import classNames from 'classnames'

import { styled, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import { createSvgIcon } from '@mui/material'
import inlineSvg from 'react-inlinesvg'

import { UserProfile } from '@quiet/types'
import { createLogger } from '../../../logger'
import lockIconSvg from '../../../static/images/lock.svg'

const PREFIX = 'ChannelHeaderComponent'

const classes = {
  root: `${PREFIX}root`,
  title: `${PREFIX}title`,
  subtitle: `${PREFIX}subtitle`,
  subtitleSmall: `${PREFIX}subtitleSmall`,
  spendButton: `${PREFIX}spendButton`,
  actions: `${PREFIX}actions`,
  switch: `${PREFIX}switch`,
  tab: `${PREFIX}tab`,
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
  [`& .${classes.root}`]: {
    height: '75px',
    paddingLeft: 20,
    paddingRight: 24,
    borderBottom: `1px solid ${theme.palette.colors.border01}`,
  },

  [`& .${classes.title}`]: {
    fontSize: '1rem',
    lineHeight: '1.68',
  },

  [`& .${classes.subtitle}`]: {
    fontSize: '0.8rem',
  },

  [`& .${classes.subtitleSmall}`]: {
    fontSize: '0.7rem',
    lineHeight: '0.9',
  },

  [`& .${classes.spendButton}`]: {
    fontSize: 13,
  },

  [`& .${classes.actions}`]: {},

  [`& .${classes.switch}`]: {
    maxWidth: 138,
    marginRight: 18,
    borderRadius: 4,
    borderStyle: 'solid',
    borderColor: theme.palette.colors.gray03,
  },

  [`& .${classes.tab}`]: {
    fontSize: 12,
    minHeight: 22,
    width: 65,
    minWidth: 0,
    lineHeight: '18px',
    padding: 0,
    textTransform: 'none',
    backgroundColor: theme.palette.colors.gray03,
    color: theme.palette.colors.gray40,
    fontWeight: 'normal',
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

  [`& .${classes.menu}`]: {
    padding: '20px',
    cursor: 'pointer',
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
  const headerTitle = isPublic ? `#${channelNameTruncated}` : channelNameTruncated
  const LockIcon = createSvgIcon(inlineSvg({ src: lockIconSvg }) as React.ReactElement, 'Lock')

  return (
    <Root className={classes.wrapper}>
      <Grid container className={classes.root} justifyContent='space-between' alignItems='center' direction='row'>
        <Grid item>
          <Grid item container alignItems='center'>
            <Grid item>
              <Grid container justifyContent='space-between' alignItems='center' direction='row' gap='2px'>
                {!isPublic ? (
                  <LockIcon
                    style={{ ...theme.typography.subtitle1 }}
                    className={classNames({
                      [classes.title]: true,
                      [classes.bold]: true,
                      [classes.lock]: true,
                    })}
                    data-testid={'channelTitle-private'}
                  />
                ) : (
                  <></>
                )}
                <Typography
                  noWrap
                  style={{ maxWidth: wrapperWidth }}
                  variant='subtitle1'
                  className={classNames({
                    [classes.title]: true,
                    [classes.bold]: true,
                  })}
                  data-testid={'channelTitle'}
                >
                  {headerTitle}
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
