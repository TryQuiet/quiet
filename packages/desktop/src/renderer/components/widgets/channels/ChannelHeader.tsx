import React from 'react'

import classNames from 'classnames'

import { styled } from '@mui/material/styles'

import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'

import Icon from '../../ui/Icon/Icon'
import dots from '../../../static/images/dots.svg'

const PREFIX = 'ChannelHeaderComponent'

const classes = {
  root: `${PREFIX}root`,
  title: `${PREFIX}title`,
  subtitle: `${PREFIX}subtitle`,
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
  menu: `${PREFIX}menu`
}

const Root = styled('div')(({ theme }) => ({
  [`& .${classes.root}`]: {
    height: '75px',
    paddingLeft: 20,
    paddingRight: 24,
    borderBottom: `1px solid ${theme.palette.colors.veryLightGray}`
  },

  [`& .${classes.title}`]: {
    fontSize: '1rem',
    lineHeight: '1.66'
  },

  [`& .${classes.subtitle}`]: {
    fontSize: '0.8rem'
  },

  [`& .${classes.spendButton}`]: {
    fontSize: 13
  },

  [`& .${classes.actions}`]: {},

  [`& .${classes.switch}`]: {
    maxWidth: 138,
    marginRight: 18,
    borderRadius: 4,
    borderStyle: 'solid',
    borderColor: theme.palette.colors.gray03
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
    fontWeight: 'normal'
  },

  [`& .${classes.tabs}`]: {
    minHeight: 0
  },

  [`& .${classes.selected}`]: {
    color: theme.palette.colors.trueBlack,
    backgroundColor: theme.palette.colors.white
  },

  [`& .${classes.indicator}`]: {
    maxHeight: 0
  },

  [`& .${classes.descriptionDiv}`]: {
    top: 75,
    padding: '12px 25px 12px 20px',
    backgroundColor: theme.palette.colors.white,
    boxShadow: `0px 1px 0px ${theme.palette.colors.veryLightGray}`
  },

  [`&.${classes.wrapper}`]: {},

  [`& .${classes.iconDiv}`]: {
    marginLeft: 12
  },

  [`& .${classes.iconButton}`]: {
    padding: 0
  },

  [`& .${classes.bold}`]: {
    fontWeight: 500
  },

  [`& .${classes.menu}`]: {
    padding: '20px',
    cursor: 'pointer'
  }
}))

export interface ChannelHeaderProps {
  channelName: string
  openContextMenu?: () => void
  enableContextMenu: boolean
}

export const ChannelHeaderComponent: React.FC<ChannelHeaderProps> = ({
  channelName,
  openContextMenu,
  enableContextMenu
}) => {
  const debounce = (fn, ms: number) => {
    let timer: ReturnType<typeof setTimeout> | null
    return (_: any) => {
      if (timer) {
        clearTimeout(timer)
      }
      // @ts-ignore
      timer = setTimeout(_ => {
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

  return (
    <Root className={classes.wrapper}>
      <Grid
        container
        className={classes.root}
        justifyContent='space-between'
        alignItems='center'
        direction='row'>
        <Grid item>
          <Grid item container alignItems='center'>
            <Grid item>
              <Typography
                noWrap
                style={{ maxWidth: wrapperWidth }}
                variant='subtitle1'
                className={classNames({
                  [classes.title]: true,
                  [classes.bold]: true
                })}
                data-testid={'channelTitle'}>
                {`#${channelName?.substring(0, 20)}`}
              </Typography>
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
          alignItems='center'>
          {enableContextMenu && (
            <Grid item className={classes.menu} onClick={openContextMenu} data-testId={'channelContextMenuButton'}>
              <Icon src={dots} />
            </Grid>
          )}
        </Grid>
      </Grid>
    </Root>
  )
}

export default ChannelHeaderComponent
