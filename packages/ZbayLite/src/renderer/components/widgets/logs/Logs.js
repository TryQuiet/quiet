import React, { useState } from 'react'
import * as R from 'ramda'
import classnames from 'classnames'
// import { AutoSizer } from 'react-virtualized'
import { Scrollbars } from 'react-custom-scrollbars'
import { shell } from 'electron'
import PropTypes from 'prop-types'

import { withStyles } from '@material-ui/core/styles'

import Grid from '@material-ui/core/Grid'
import { Typography } from '@material-ui/core'

import IconButton from '../../ui/IconButton'
import Icon from '../../ui/Icon'
import ExitIcon from '../../../static/images/logs/exit.svg'

const styles = theme => ({
  root: {
    width: '315px',
    height: '100vh',
    backgroundColor: theme.palette.colors.logsActiveDark
  },
  title: {
    lineHeight: '18px',
    fontStyle: 'normal',
    fontWeight: 'normal',
    color: theme.palette.colors.logsTitleGray,
    marginTop: 20
  },
  topBar: {
    width: '100%',
    height: 58,
    paddingLeft: 20,
    paddingRight: 25,
    backgroundColor: theme.palette.colors.logsDark
  },
  iconButton: {
    marginTop: 20,
    padding: 0
  },
  tabBar: {
    color: theme.palette.colors.logsTitleGray,
    backgroundColor: theme.palette.colors.logsDark
  },
  tab: {
    marginRight: 1,
    cursor: 'pointer',
    padding: '4px 16px',
    backgroundColor: theme.palette.colors.logsInactiveDark
  },
  tabText: {
    lineHeight: '18px',
    fontStyle: 'normal',
    fontWeight: 'normal',
    color: theme.palette.colors.logsTabWhite
  },
  activeTab: {
    backgroundColor: theme.palette.colors.logsActiveDark
  },
  mainLogsWindow: {
    margin: '0px 0px',
    width: '315px',
    height: '100%',
    backgroundColor: theme.palette.colors.logsActiveDark
  },
  logsItem: {
    width: '100%',
    padding: '0px 8px'
  },
  logsLine: {
    fontFamily: 'Menlo Regular',
    lineHeight: '18px',
    fontStyle: 'normal',
    fontWeight: 'normal',
    color: theme.palette.colors.logsTitleGray,
    wordWrap: 'break-word'
  },
  transactionLine: {
    fontFamily: 'Menlo Regular',
    lineHeight: '18px',
    fontStyle: 'normal',
    fontWeight: 'normal',
    color: theme.palette.colors.logsTitleGray,
    wordWrap: 'break-word',
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.colors.lushSky
    }
  },
  verticalScrollBar: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: '100%',
    display: 'flex',
    'justify-content': 'center',
    backgroundColor: theme.palette.colors.logsScrollBar
  },
  renderThumbVertical: {
    borderRadius: 25,
    backgroundColor: theme.palette.colors.logsScrollBarThumb,
    cursor: 'pointer'
  },
  innerContent: {
    marginTop: 8,
    paddingRight: 15,
    paddingBottom: 5
  }
})

const LogsTypes = {
  TRANSACTIONS: 'TRANSACTIONS',
  APPLICATION_LOGS: 'APPLICATION_LOGS',
  NODE_DEBUG: 'NODE_DEBUG'
}

export const LogsComponent = ({ classes, debugLogs, closeLogsWindow, applicationLogs, transactionsLogs, height }) => {
  const logs = {
    [LogsTypes.TRANSACTIONS]: transactionsLogs,
    [LogsTypes.NODE_DEBUG]: debugLogs,
    [LogsTypes.APPLICATION_LOGS]: applicationLogs
  }
  const messagesEndRef = React.useRef(null)
  const [currentActiveTab, setActiveTab] = useState(LogsTypes.NODE_DEBUG)
  const changeTab = (tab) => {
    setActiveTab(tab)
    messagesEndRef.current.scrollToBottom()
  }
  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollToBottom()
    }
  })
  return (
    <Grid container className={classes.root} alignContent={'flex-start'} item>
      <Grid container className={classes.topBar} justify={'space-between'} item>
        <Grid item>
          <Typography variant={'subtitle1'} className={classes.title}>Logs</Typography>
        </Grid>
        <Grid item>
          <IconButton className={classes.iconButton} onClick={closeLogsWindow}>
            <Icon src={ExitIcon} />
          </IconButton>
        </Grid>
      </Grid>
      <Grid container direction={'row'} className={classes.tabBar} justify={'flex-start'} wrap={'nowrap'} item>
        <Grid item onClick={() => changeTab(LogsTypes.TRANSACTIONS)} className={classnames(classes.tab, {
          [classes.activeTab]: currentActiveTab === LogsTypes.TRANSACTIONS
        })}>
          <Typography variant={'caption'} className={classes.tabText}>Transactions</Typography>
        </Grid>
        <Grid item onClick={() => changeTab(LogsTypes.NODE_DEBUG)} className={classnames(classes.tab, {
          [classes.activeTab]: currentActiveTab === LogsTypes.NODE_DEBUG
        })}>
          <Typography variant={'caption'} className={classes.tabText}>Zcashd</Typography>
        </Grid>
        <Grid item onClick={() => changeTab(LogsTypes.APPLICATION_LOGS)} className={classnames(classes.tab, {
          [classes.activeTab]: currentActiveTab === LogsTypes.APPLICATION_LOGS
        })}>
          <Typography variant={'caption'} className={classes.tabText}>Application</Typography>
        </Grid>
      </Grid>
      <Grid container className={classes.mainLogsWindow} item>
        <Scrollbars
          ref={messagesEndRef}
          autoHideTimeout={500}
          style={{ width: 315, height: height - 90 }}
          renderTrackVertical={props => <div {...props} style={{ width: '14px' }} className={classes.verticalScrollBar} />}
          renderThumbVertical={props => <div {...props} style={{ width: '8px' }} className={classes.renderThumbVertical} />}
        >
          <div className={classes.innerContent}>
            {logs[currentActiveTab].map((logLine, i) => currentActiveTab === LogsTypes.TRANSACTIONS
              ? <Grid item key={i} className={classes.logsItem}><Typography onClick={() => shell.openExternal(`https://explorer.zcha.in/transactions/${logLine}`)} className={classes.transactionLine} variant={'caption'}>{logLine}</Typography></Grid>
              : <Grid item key={i} className={classes.logsItem}><Typography className={classes.logsLine} variant={'caption'} key={i}>{logLine}</Typography></Grid>)
            }
          </div>
        </Scrollbars>
          )}
      </Grid>
    </Grid>
  )
}

LogsComponent.propTypes = {
  classes: PropTypes.object.isRequired,
  debugLogs: PropTypes.array.isRequired,
  applicationLogs: PropTypes.array.isRequired,
  transactionsLogs: PropTypes.array.isRequired,
  closeLogsWindow: PropTypes.func.isRequired,
  height: PropTypes.number
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(LogsComponent)
