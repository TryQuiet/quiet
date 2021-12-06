import React, { useState } from 'react'
import classNames from 'classnames'

import Typography from '@material-ui/core/Typography'
import Grid from '@material-ui/core/Grid'
import Clear from '@material-ui/icons/Clear'
import { makeStyles } from '@material-ui/core/styles'

import IconButton from '../../ui/Icon/IconButton'
import Icon from '../../ui/Icon/Icon'
import silenced from '../../../static/images/silenced.svg'
import silencedBlack from '../../../static/images/silencedBlack.svg'
import Tooltip from '../../ui/Tooltip/Tooltip'
import ChannelMenuActionComponent, { ChannelMenuActionProps } from './ChannelMenuAction'

import { PublicChannel } from '@zbayapp/nectar'

const useStyles = makeStyles(theme => ({
  root: {
    height: '75px',
    paddingLeft: 20,
    paddingRight: 24,
    borderBottom: `1px solid ${theme.palette.colors.veryLightGray}`
  },
  title: {
    fontSize: '1rem',
    lineHeight: '1.66'
  },
  subtitle: {
    fontSize: '0.8rem'
  },
  spendButton: {
    fontSize: 13
  },
  actions: {},
  switch: {
    maxWidth: 138,
    marginRight: 18,
    borderRadius: 4,
    borderStyle: 'solid',
    borderColor: theme.palette.colors.gray03
  },
  tab: {
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
  tabs: {
    minHeight: 0
  },
  selected: {
    color: theme.palette.colors.trueBlack,
    backgroundColor: theme.palette.colors.white
  },
  indicator: {
    maxHeight: 0
  },
  descriptionDiv: {
    top: 75,
    padding: '12px 25px 12px 20px',
    backgroundColor: theme.palette.colors.white,
    boxShadow: `0px 1px 0px ${theme.palette.colors.veryLightGray}`
  },
  wrapper: {},
  iconDiv: {
    marginLeft: 12
  },
  iconButton: {
    padding: 0
  },
  bold: {
    fontWeight: 500
  },
  silenceDiv: {
    width: 20,
    height: 20,
    marginLeft: 11,
    cursor: 'pointer'
  }
}))

export interface ChannelHeaderProps {
  channel: PublicChannel
}

export const ChannelHeaderComponent: React.FC<ChannelHeaderProps & ChannelMenuActionProps> = ({
  channel,
  ...channelMenuActionProps
}) => {
  const classes = useStyles({})

  const [descriptionVisible, setDescriptionVisible] = useState(true)

  const debounce = (fn, ms: number) => {
    let timer: ReturnType<typeof setTimeout> | null
    return (_: any) => {
      if (timer) {
        clearTimeout(timer)
      }
      timer = setTimeout(_ => {
        timer = null
        fn.apply(this)
      }, ms)
    }
  }

  const [silenceHover, setSilenceHover] = React.useState(false)
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
    <div className={classes.wrapper}>
      <Grid
        container
        className={classes.root}
        justify='space-between'
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
                })}>
                {`#${channel?.name?.substring(0, 20)}`}
              </Typography>
            </Grid>
            {channelMenuActionProps.mutedFlag && (
              <Tooltip placement='bottom' title='Unmute'>
                <Grid
                  item
                  className={classes.silenceDiv}
                  onMouseEnter={() => setSilenceHover(true)}
                  onMouseLeave={() => setSilenceHover(false)}
                  onClick={() => {
                    channelMenuActionProps.onUnmute()
                  }}>
                  <Icon src={silenceHover ? silencedBlack : silenced} />
                </Grid>
              </Tooltip>
            )}
          </Grid>
        </Grid>
        <Grid
          item
          xs
          container
          className={classes.actions}
          justify='flex-end'
          alignContent='center'
          alignItems='center'>
          <Grid item>
            <ChannelMenuActionComponent {...channelMenuActionProps} />
          </Grid>
        </Grid>
      </Grid>
      {descriptionVisible && channel.description && (
        <Grid container className={classes.descriptionDiv}>
          <Grid item xs>
            <Typography variant='body2'>{channel.description}</Typography>
          </Grid>
          <Grid item className={classes.iconDiv}>
            <IconButton
              onClick={() => {
                setDescriptionVisible(false)
              }}>
              <Clear />
            </IconButton>
          </Grid>
        </Grid>
      )}
    </div>
  )
}

export default ChannelHeaderComponent
