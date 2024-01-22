import React, { useState } from 'react'

import { styled } from '@mui/material/styles'

import { Grid, Tabs, Typography } from '@mui/material'
import AppBar from '@mui/material/AppBar'
import { Scrollbars } from 'rc-scrollbars'
import { AutoSizer } from 'react-virtualized'

import { useModal } from '../../containers/hooks'
import Modal from '../ui/Modal/Modal'

import Tab from '../ui/Tab/Tab'

const PREFIX = 'SettingsModal'

const classes = {
  indicator: `${PREFIX}indicator`,
  leaveComunity: `${PREFIX}leaveCommunity`,
}

const StyledModalContent = styled(Grid)(() => ({
  zIndex: 9002,
  paddingLeft: 20,
  paddingTop: 32,
  paddingRight: 32,
}))

const StyledTabsWrapper = styled(Grid)(() => ({
  width: 168,
}))

const StyledAppBar = styled(AppBar, { label: 'xxxxx' })(({ theme }) => ({
  backgroundColor: '#fff',
  boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.0)',

  [`& .${classes.leaveComunity}`]: {
    opacity: '1',
    padding: '10px 8px 8px 8px',
    color: theme.palette.colors.hotPink,
    fontSize: '14px',
    fontWeight: '400',
    alignItems: 'flex-start',
    textTransform: 'none',
    lineHeight: '21px',
    minHeight: '0px',
  },
}))

const StyledTabs = styled(Tabs)(({ theme }) => ({
  color: theme.palette.colors.trueBlack,

  [`& .${classes.indicator}`]: {
    height: '0 !important',
  },
}))

const TabComponentWrapper = styled(Grid)(() => ({
  marginLeft: 32,
}))

export interface SettingsComponentProps {
  open: boolean
  handleClose: () => void
  isOwner: boolean
  tabs: any
  leaveCommunityModal: ReturnType<typeof useModal>
  isWindows?: boolean
}

export const SettingsComponent: React.FC<SettingsComponentProps> = ({
  open,
  handleClose,
  isOwner,
  tabs,
  leaveCommunityModal,
  isWindows,
}) => {
  const [contentRef, setContentRef] = React.useState<HTMLDivElement | null>(null)

  const scrollbarRef = React.useRef(null)

  const [offset, setOffset] = React.useState(0)

  const defaultCurrentTab = 'invite'
  const [currentTab, setCurrentTab] = useState(defaultCurrentTab)

  const adjustOffset = () => {
    if (!contentRef?.clientWidth) return
    if (contentRef.clientWidth > 800) {
      setOffset((contentRef.clientWidth - 800) / 2)
    }
  }

  const handleChange = (tab: string) => {
    setCurrentTab(tab)
  }

  // Workaround for default display of invite tab.
  React.useEffect(() => {
    setCurrentTab(defaultCurrentTab)
  }, [isOwner])

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
      title={'Settings'}
      testIdPrefix='settings'
      isBold
      addBorder
      contentWidth='100%'
    >
      <StyledModalContent
        ref={ref => {
          if (ref) {
            setContentRef(ref)
          }
        }}
        container
        direction='row'
      >
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
              classes={{ indicator: classes.indicator }}
            >
              <Tab value='about' label='About' data-testid={'about-settings-tab'} />
              <Tab value='notifications' label='Notifications' data-testid={'notifications-settings-tab'} />
              <Tab value='invite' label='Add Members' data-testid={'invite-settings-tab'} />
              <Tab value='qrcode' label='QR Code' data-testid={'qr-code-tab'} />
            </StyledTabs>
            {!isWindows && (
              <Grid style={{ marginTop: '24px', cursor: 'pointer' }}>
                <Typography
                  data-testid='leave-community-tab'
                  className={classes.leaveComunity}
                  onClick={leaveCommunityModal.handleOpen}
                >
                  Leave community
                </Typography>
              </Grid>
            )}
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
                  style={{ width: maxWidth + offset, height: height }}
                >
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

export default SettingsComponent
