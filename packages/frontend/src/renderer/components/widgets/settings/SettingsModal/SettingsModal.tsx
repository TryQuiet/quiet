import React, { useState } from 'react'

import Tabs from '@material-ui/core/Tabs'
import AppBar from '@material-ui/core/AppBar'
import { makeStyles } from '@material-ui/core/styles'
import { Grid } from '@material-ui/core'
import { AutoSizer } from 'react-virtualized'
import { Scrollbars } from 'rc-scrollbars'

import Modal from '../../../ui/Modal/Modal'
import Tab from '../../../ui/Tab/Tab'
import AccountSettingsForm from '../../../../containers/widgets/settings/AccountSettingsForm'
import Notifications from '../../../../containers/widgets/settings/Notifications'
import InviteToCommunity from '../../../../containers/widgets/settings/InviteToCommunity'

const tabs = {
  account: AccountSettingsForm,
  notifications: Notifications,
  invite: InviteToCommunity
}

const useStyles = makeStyles(theme => ({
  root: {
    zIndex: 1000,
    paddingLeft: 20,
    paddingTop: 32,
    paddingRight: 32
  },
  tabs: {
    color: theme.palette.colors.trueBlack
  },
  indicator: {
    height: '0 !important'
  },
  appbar: {
    backgroundColor: '#fff',
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.0)'
  },
  tabsDiv: {
    width: 168
  },
  selected: {
    backgroundColor: theme.palette.colors.lushSky,
    borderRadius: 5,
    color: `${theme.palette.colors.white} !important`
  },
  tab: {
    minHeight: 32,
    color: theme.palette.colors.trueBlack,
    opacity: 1,
    fontStyle: 'normal',
    fontWeight: 'normal'
  },
  content: {
    marginLeft: 32
  }
}))

interface SettingsModalProps {
  title: string
  owner: boolean
  open: boolean
  handleClose: () => void
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ title, owner, open, handleClose }) => {
  const classes = useStyles({})

  const [contentRef, setContentRef] = React.useState(null)

  const scrollbarRef = React.useRef()

  const [offset, setOffset] = React.useState(0)
  const defaultCurrentTab = owner ? 'invite' : 'notifications'
  const [currentTab, setCurrentTab] = useState(defaultCurrentTab)

  const adjustOffset = () => {
    if (contentRef.clientWidth > 800) {
      setOffset((contentRef.clientWidth - 800) / 2)
    }
  }

  const handleChange = (tab) => {
    setCurrentTab(tab)
  }

  React.useEffect(() => {
    if (contentRef) {
      window.addEventListener('resize', adjustOffset)
      adjustOffset()
    }
  }, [contentRef])

  const TabComponent = tabs[currentTab]

  return (
    <Modal open={open} handleClose={handleClose} title={title} testIdPrefix='settings' isBold addBorder contentWidth='100%'>
      <Grid
        ref={ref => {
          if (ref) {
            setContentRef(ref)
          }
        }}
        container
        direction='row'
        className={classes.root}>
        <Grid item className={classes.tabsDiv} style={{ marginLeft: offset }}>
          <AppBar position='static' className={classes.appbar}>
            <Tabs
              value={currentTab}
              onChange={(event, value) => {
                event.persist()
                handleChange(value)
              }}
              orientation='vertical'
              className={classes.tabs}
              textColor='inherit'
              classes={{ indicator: classes.indicator }}>
              <Tab
                value='notifications'
                label='Notifications'
                classes={{ selected: classes.selected }}
                data-testid={'notifications-settings-tab'}
              />
              {owner && (
                <Tab value='invite' label='Add members' classes={{ selected: classes.selected }} data-testid={'invite-settings-tab'} />
              )}
            </Tabs>
          </AppBar>
        </Grid>
        <Grid item xs>
          <AutoSizer>
            {({ width, height }) => {
              const maxWidth = width > 632 ? 632 : width
              return (
                <Scrollbars
                  ref={scrollbarRef}
                  autoHideTimeout={500}
                  style={{ width: maxWidth + offset, height: height }}>
                  <Grid item className={classes.content} style={{ paddingRight: offset }}>
                    <TabComponent setCurrentTab={setCurrentTab} scrollbarRef={scrollbarRef} />
                  </Grid>
                </Scrollbars>
              )
            }}
          </AutoSizer>
        </Grid>
      </Grid>
    </Modal>
  )
}

export default SettingsModal
