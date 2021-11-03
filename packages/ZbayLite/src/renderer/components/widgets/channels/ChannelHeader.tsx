import React from 'react'

import Typography from '@material-ui/core/Typography'
import Grid from '@material-ui/core/Grid'
import Clear from '@material-ui/icons/Clear'
import classNames from 'classnames'
import { makeStyles } from '@material-ui/core/styles'

import ChannelInfoModal from '../../../containers/widgets/channels/ChannelInfoModal'
import DirectMessagesInfoModal from '../../../containers/widgets/channels/DirectMessagesInfoModal'
import { CHANNEL_TYPE } from '../../pages/ChannelTypes'
import ChannelMenuAction from '../../../containers/widgets/channels/ChannelMenuAction'
import DirectMessagesMenuActions from '../../../containers/widgets/channels/DirectMessagesMenuActions'
import IconButton from '../../ui/Icon/IconButton'
import Icon from '../../ui/Icon/Icon'
import silenced from '../../../static/images/silenced.svg'
import silencedBlack from '../../../static/images/silencedBlack.svg'
import Tooltip from '../../ui/Tooltip/Tooltip'
import { Channel } from '../../../store/handlers/channel'

const useStyles = makeStyles((theme) => ({
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

export const channelTypeToActions = {
  [CHANNEL_TYPE.DIRECT_MESSAGE]: DirectMessagesMenuActions,
  [CHANNEL_TYPE.NORMAL]: ChannelMenuAction
}

const prefix = {
  [CHANNEL_TYPE.DIRECT_MESSAGE]: '@',
  [CHANNEL_TYPE.NORMAL]: '#'
}

// TODO: [reafactoring] we should have channel stats for unread and members count

export interface ChannelHeaderProps {
  updateShowInfoMsg?: (arg: boolean) => void
  directMessage?: boolean
  channelType: CHANNEL_TYPE
  tab?: number
  setTab?: (arg: number) => void
  channel?: Channel
  mutedFlag?: boolean
  unmute?: () => void
  name?: string
  contactId?: string
}

export const ChannelHeader: React.FC<ChannelHeaderProps> = ({
  setTab,
  channel = { displayableMessageLimit: 50 },
  directMessage = false,
  channelType = 3,
  updateShowInfoMsg,
  mutedFlag,
  unmute,
  name
}) => {
  const classes = useStyles({})
  const debounce = (fn, ms: number) => {
    let timer: NodeJS.Timeout | null
    return _ => {
      if (timer) {
        clearTimeout(timer)
      }
      timer = setTimeout(_ => {
        timer = null
        fn.apply(this) // eslint-disable-line
      }, ms)
    }
  }
  const ActionsMenu = channelTypeToActions[channelType]
  const [silenceHover, setSilenceHover] = React.useState(false)
  const [wrapperWidth, setWrapperWidth] = React.useState(0)
  React.useEffect(() => {
    setWrapperWidth(window.innerWidth - 300)
  })
  React.useEffect(() => {
    setTab(0)
  }, [name])

  React.useEffect((): any => {
    const handleResize = debounce(function handleResize() {
      setWrapperWidth(window.innerWidth - 300)
    }, 200)

    window.addEventListener('resize', handleResize)

    return _ => {
      window.removeEventListener('resize', handleResize)
    }
  })
  return (
    <div className={classes.wrapper}>
      <Grid
        container
        alignItems='center'
        justify='space-between'
        className={classes.root}
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
                {`${prefix[channelType]}${channel?.name?.substring(0, 20)}`}
              </Typography>
            </Grid>
            {mutedFlag && (
              <Tooltip placement='bottom' title='Unmute'>
                <Grid
                  item
                  className={classes.silenceDiv}
                  onMouseEnter={() => setSilenceHover(true)}
                  onMouseLeave={() => setSilenceHover(false)}
                  onClick={() => {
                    unmute()
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
            <ActionsMenu directMessage={directMessage} />
            {directMessage ? <DirectMessagesInfoModal /> : <ChannelInfoModal channel={channel} />}
          </Grid>
        </Grid>
      </Grid>
      {channel.showInfoMsg && channel.description && (
        <Grid container className={classes.descriptionDiv}>
          <Grid item xs>
            <Typography variant='body2'>{channel.description}</Typography>
          </Grid>
          <Grid item className={classes.iconDiv}>
            <IconButton
              onClick={() => {
                updateShowInfoMsg(false)
              }}>
              <Clear />
            </IconButton>
          </Grid>
        </Grid>
      )}
    </div>
  )
}

export default ChannelHeader
