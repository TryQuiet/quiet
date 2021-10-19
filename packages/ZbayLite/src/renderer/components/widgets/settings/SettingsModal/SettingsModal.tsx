import React from 'react'

import Tabs from '@material-ui/core/Tabs'
import AppBar from '@material-ui/core/AppBar'
import { makeStyles } from '@material-ui/core/styles'
import { Grid } from '@material-ui/core'
import { AutoSizer } from 'react-virtualized'
import { Scrollbars } from 'rc-scrollbars'

import Modal from '../../../ui/Modal/Modal'
import Tab from '../../../ui/Tab/Tab'
import AccountSettingsForm from '../../../../containers/widgets/settings/AccountSettingsForm'
import Security from '../../../../containers/widgets/settings/Security'
import Notifications from '../../../../containers/widgets/settings/Notifications'

const tabs = {
  account: AccountSettingsForm,
  security: Security,
  notifications: Notifications
}

const useStyles = makeStyles((theme) => ({
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

const handleChange = (clearCurrentOpenTab, setCurrentTab, value) => {
  clearCurrentOpenTab()
  setCurrentTab(value)
}

interface SettingsModalProps {
  open: boolean
  handleClose: () => void
  modalTabToOpen: string
  clearCurrentOpenTab: () => void
  currentTab: string
  setCurrentTab: (value: string) => void
  user: string
  blockedUsers: string[]
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  handleClose,
  modalTabToOpen,
  clearCurrentOpenTab,
  currentTab,
  setCurrentTab,
  user,
  blockedUsers
}) => {
  const classes = useStyles({})
  const [contentRef, setContentRef] = React.useState(null)
  const scrollbarRef = React.useRef()
  const [offset, setOffset] = React.useState(0)
  const TabComponent = tabs[modalTabToOpen || currentTab]
  const adjustOffset = () => {
    if (contentRef.clientWidth > 800) {
      setOffset((contentRef.clientWidth - 800) / 2)
    }
  }
  React.useEffect(() => {
    if (contentRef) {
      window.addEventListener('resize', adjustOffset)
      adjustOffset()
    }
  }, [contentRef])
  return (
    <Modal
      open={open}
      handleClose={handleClose}
      title={user}
      isBold
      addBorder
      contentWidth='100%'
    >
      <Grid
        ref={ref => {
          if (ref) {
            setContentRef(ref)
          }
        }}
        container
        direction='row'
        className={classes.root}
      >
        <Grid item className={classes.tabsDiv} style={{ marginLeft: offset }}>
          <AppBar position='static' className={classes.appbar}>
            <Tabs
              value={modalTabToOpen || currentTab}
              onChange={(_e, value) =>
                handleChange(clearCurrentOpenTab, setCurrentTab, value)
              }
              orientation='vertical'
              className={classes.tabs}
              textColor='inherit'
              classes={{ indicator: classes.indicator }}
            >
              <Tab
                value='account'
                label='Account'
                classes={{ selected: classes.selected }}
              />
              <Tab
                value='notifications'
                label='Notifications'
                classes={{ selected: classes.selected }}
              />
              <Tab
                value='security'
                label='Security'
                classes={{ selected: classes.selected }}
              />
              {blockedUsers?.length && (
                <Tab
                  value='blockedusers'
                  label='Blocked Users'
                  classes={{ selected: classes.selected }}
                />
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
                  style={{ width: maxWidth + offset, height: height }}
                >
                  <Grid
                    item
                    className={classes.content}
                    style={{ paddingRight: offset }}
                  >
                    <TabComponent
                      setCurrentTab={setCurrentTab}
                      scrollbarRef={scrollbarRef}
                    />
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
