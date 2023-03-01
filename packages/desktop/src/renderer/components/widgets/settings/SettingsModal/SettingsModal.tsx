import React, { useState } from 'react'

import { styled } from '@mui/material/styles'

import { Grid, Tabs } from '@mui/material'
import AppBar from '@mui/material/AppBar'
import { Scrollbars } from 'rc-scrollbars'
import { AutoSizer } from 'react-virtualized'

import AccountSettingsForm from '../../../../containers/widgets/settings/AccountSettingsForm'
import InviteToCommunity from '../../../../containers/widgets/settings/InviteToCommunity'
import Notifications from '../../../../containers/widgets/settings/Notifications'
import { LeaveCommunity } from '../../../LeaveCommunity/LeaveCommunity'
import { About } from '../About'

import Modal from '../../../ui/Modal/Modal'
import Tab from '../../../ui/Tab/Tab'

import theme from 'packages/desktop/src/renderer/theme'

const PREFIX = 'SettingsModal'

const classes = {
  indicator: `${PREFIX}indicator`
}

const StyledModalContent = styled(Grid)(() => ({
  zIndex: 1000,
  paddingLeft: 20,
  paddingTop: 32,
  paddingRight: 32
}))

const StyledTabsWrapper = styled(Grid)(() => ({
  width: 168
}))

const StyledAppBar = styled(AppBar, { label: 'xxxxx' })(() => ({
  backgroundColor: '#fff',
  boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.0)'
}))

const StyledTabs = styled(Tabs)(({ theme }) => ({
  color: theme.palette.colors.trueBlack,

  [`& .${classes.indicator}`]: {
    height: '0 !important'
  }
}))

const TabComponentWrapper = styled(Grid)(() => ({
  marginLeft: 32
}))

const tabs = {
  account: AccountSettingsForm,
  notifications: Notifications,
  invite: InviteToCommunity,
  about: About,
  leave: LeaveCommunity
}

export interface SettingsModalProps {
  title: string
  isOwner: boolean
  open: boolean
  handleClose: () => void
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  title,
  isOwner,
  open,
  handleClose
}) => {
  const [contentRef, setContentRef] = React.useState(null)

  const scrollbarRef = React.useRef()

  const [offset, setOffset] = React.useState(0)

  const defaultCurrentTab = isOwner ? 'invite' : 'notifications'
  const [currentTab, setCurrentTab] = useState(defaultCurrentTab)

  const adjustOffset = () => {
    if (contentRef.clientWidth > 800) {
      setOffset((contentRef.clientWidth - 800) / 2)
    }
  }

  const handleChange = (tab: string) => {
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
    <Modal
      open={open}
      handleClose={handleClose}
      title={title}
      testIdPrefix='settings'
      isBold
      addBorder
      contentWidth='100%'>
      <StyledModalContent
        ref={ref => {
          if (ref) {
            setContentRef(ref)
          }
        }}
        container
        direction='row'>
        <StyledTabsWrapper item style={{ marginLeft: offset }}>
          <StyledAppBar position='static'>
            <StyledTabs
              value={currentTab}
              onChange={(event, value) => {
                event.persist()
                handleChange(value)
              }}
              orientation='vertical'
              textColor='inherit'
              classes={{ indicator: classes.indicator }}>
              <Tab
                value='notifications'
                label='Notifications'
                data-testid={'notifications-settings-tab'}
              />
              {isOwner && (
                <Tab value='invite' label='Add members' data-testid={'invite-settings-tab'} />
              )}
              <Tab value='about' label='About' data-testid={'about-settings-tab'} />
              <Tab
                value='leave'
                label='Leave community'
                data-testid={'leave-community-tab'}
                style={{
                  color: theme.palette.colors.red
                }}
              />
            </StyledTabs>
          </StyledAppBar>
        </StyledTabsWrapper>
        <Grid item xs>
          <AutoSizer>
            {({ width, height }) => {
              const maxWidth = width > 632 ? 632 : width
              return (
                <Scrollbars
                  ref={scrollbarRef}
                  autoHideTimeout={500}
                  style={{ width: maxWidth + offset, height: height }}>
                  <TabComponentWrapper item style={{ paddingRight: offset }}>
                    <TabComponent setCurrentTab={setCurrentTab} scrollbarRef={scrollbarRef} />
                  </TabComponentWrapper>
                </Scrollbars>
              )
            }}
          </AutoSizer>
        </Grid>
      </StyledModalContent>
    </Modal>
  )
}

export default SettingsModal
