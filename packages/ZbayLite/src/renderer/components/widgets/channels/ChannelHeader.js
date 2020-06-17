import React from 'react'
import PropTypes from 'prop-types'
import Immutable from 'immutable'
import * as R from 'ramda'

import Typography from '@material-ui/core/Typography'
import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'
import Clear from '@material-ui/icons/Clear'
import { Tabs, Tab } from '@material-ui/core'
import classNames from 'classnames'

import ChannelInfoModal from '../../../containers/widgets/channels/ChannelInfoModal'
import DirectMessagesInfoModal from '../../../containers/widgets/channels/DirectMessagesInfoModal'
import { CHANNEL_TYPE } from '../../../components/pages/ChannelTypes'
import ChannelMenuAction from '../../../containers/widgets/channels/ChannelMenuAction'
import OfferMenuActions from '../../../containers/widgets/channels/OfferMenuActions'
import DirectMessagesMenuActions from '../../../containers/widgets/channels/DirectMessagesMenuActions'
import IconButton from '../../ui/IconButton'
import Icon from '../../ui/Icon'
import silenced from '../../../static/images/silenced.svg'
import silencedBlack from '../../../static/images/silencedBlack.svg'
import Tooltip from '../../ui/Tooltip'
import { unknownUserId } from '../../../../shared/static'

const styles = theme => ({
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
    textAlign: '-webkit-center',
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
    padding: `12px 25px 12px 20px`,
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
})

export const channelTypeToActions = {
  [CHANNEL_TYPE.OFFER]: OfferMenuActions,
  [CHANNEL_TYPE.DIRECT_MESSAGE]: DirectMessagesMenuActions,
  [CHANNEL_TYPE.NORMAL]: ChannelMenuAction
}

const prefix = {
  [CHANNEL_TYPE.OFFER]: '',
  [CHANNEL_TYPE.DIRECT_MESSAGE]: '@',
  [CHANNEL_TYPE.NORMAL]: '#'
}

// TODO: [reafactoring] we should have channel stats for unread and members count

export const ChannelHeader = ({
  classes,
  tab,
  setTab,
  channel,
  directMessage,
  offer,
  members,
  channelType,
  showAdSwitch,
  updateShowInfoMsg,
  mutedFlag,
  unmute,
  isRegisteredUsername
}) => {
  const debounce = (fn, ms) => {
    let timer
    return _ => {
      clearTimeout(timer)
      timer = setTimeout(_ => {
        timer = null
        fn.apply(this) // // eslint-disable-line
      }, ms)
    }
  }
  const ActionsMenu = channelTypeToActions[channelType]
  const isFromZbay = channel.get('name') !== unknownUserId
  const [silenceHover, setSilenceHover] = React.useState(false)
  const [wrapperWidth, setWrapperWidth] = React.useState(0)
  React.useEffect(() => {
    setWrapperWidth(window.innerWidth - 300)
  })
  React.useEffect(() => {
    const handleResize = debounce(function handleResize () {
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
        direction='row'
      >
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
              >
                {isRegisteredUsername || !isFromZbay ? `${prefix[channelType]}${isFromZbay ? channel.get('name') : 'unknown'}` : channel.get('address')}
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
                  }}
                >
                  <Icon src={silenceHover ? silencedBlack : silenced} />
                </Grid>
              </Tooltip>
            )}
          </Grid>
          {!R.isNil(members) ? (
            <Typography variant='caption' className={classes.subtitle}>
              {members.size} Participants
            </Typography>
          ) : null}
        </Grid>

        <Grid
          item
          xs
          container
          className={classes.actions}
          justify='flex-end'
          alignContent='center'
          alignItems='center'
        >
          {channelType === CHANNEL_TYPE.NORMAL && showAdSwitch && (
            <Grid item className={classes.switch}>
              <Tabs
                value={tab}
                onChange={(e, value) => {
                  setTab(value)
                }}
                classes={{ root: classes.tabs, indicator: classes.indicator }}
              >
                <Tab
                  label='All'
                  classes={{ root: classes.tab, selected: classes.selected }}
                />
                <Tab
                  label='For sale'
                  classes={{ root: classes.tab, selected: classes.selected }}
                />
              </Tabs>
            </Grid>
          )}
          <Grid item>
            <ActionsMenu directMessage={directMessage} offer={offer} />
            {directMessage ? <DirectMessagesInfoModal /> : <ChannelInfoModal />}
          </Grid>
        </Grid>
      </Grid>
      {channel.get('showInfoMsg') && channel.get('description') && (
        <Grid container className={classes.descriptionDiv}>
          <Grid item xs>
            <Typography variant='body2'>
              {channel.get('description')}
            </Typography>
          </Grid>
          <Grid item className={classes.iconDiv}>
            <IconButton
              className={classes.iconButton}
              onClick={() => {
                updateShowInfoMsg(false)
              }}
            >
              <Clear />
            </IconButton>
          </Grid>
        </Grid>
      )}
    </div>
  )
}

ChannelHeader.propTypes = {
  classes: PropTypes.object.isRequired,
  directMessage: PropTypes.bool.isRequired,
  mutedFlag: PropTypes.bool,
  showAdSwitch: PropTypes.bool,
  channelType: PropTypes.number.isRequired,
  tab: PropTypes.number.isRequired,
  setTab: PropTypes.func.isRequired,
  unmute: PropTypes.func,
  channel: PropTypes.instanceOf(Immutable.Map).isRequired,
  members: PropTypes.instanceOf(Set),
  updateShowInfoMsg: PropTypes.func.isRequired,
  users: PropTypes.instanceOf(Immutable.Map).isRequired,
  isRegisteredUsername: PropTypes.bool
}

ChannelHeader.defaultProps = {
  channel: Immutable.Map(),
  directMessage: false,
  channelType: 3,
  showAdSwitch: false,
  users: Immutable.Map(),
  shouldCheckNickname: false,
  isRegisteredUsername: true
}

export default R.compose(React.memo, withStyles(styles))(ChannelHeader)
