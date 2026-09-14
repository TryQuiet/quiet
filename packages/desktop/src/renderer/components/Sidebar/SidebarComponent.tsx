import React from 'react'
import { styled } from '@mui/material/styles'
import { Scrollbars } from 'rc-scrollbars'
import { AutoSizer } from 'react-virtualized'
import IdentityPanel, { IdentityPanelProps } from './IdentityPanel/IdentityPanel'
import ChannelsPanel, { ChannelsPanelProps } from './ChannelsPanel/ChannelsPanel'
import ProminentActionsPanel from './ProminentActionsPanel/ProminentActionsPanel'
import TorStatus, { TorStatusProps } from './TorStatus'
import UserProfilePanel, { UserProfilePanelProps } from './UserProfilePanel/UserProfilePanel'
import DirectMessagesPanel, { DirectMessagesPanelProps } from './DirectMessagesPanel/DirectMessagesPanel'
import SidebarSearch from '../ui/Sidebar/SidebarSearch'
import { sidebarMetrics } from '../ui/Sidebar/sidebarMetrics'

const PREFIX = 'SidebarComponent'

const classes = {
  root: `${PREFIX}root`,
  header: `${PREFIX}header`,
  windowControls: `${PREFIX}windowControls`,
  scrollArea: `${PREFIX}scrollArea`,
  content: `${PREFIX}content`,
}

const StyledSidebar = styled('div')(({ theme }) => ({
  [`&.${classes.root}`]: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    width: sidebarMetrics.width,
    minWidth: sidebarMetrics.width,
    height: '100%',
    minHeight: '100%',
    position: 'relative',
    backgroundColor: theme.palette.colors.sidebarBackground,
    color: theme.palette.colors.white,
  },

  // "Team and search".
  [`& .${classes.header}`]: {
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    gap: sidebarMetrics.header.gap,
    paddingBottom: sidebarMetrics.header.paddingBottom,
  },

  // The strip the sidebar leaves clear for the window's own controls.
  [`& .${classes.windowControls}`]: {
    height: sidebarMetrics.header.windowControlsHeight,
    flexShrink: 0,
  },

  [`& .${classes.scrollArea}`]: {
    flex: 1,
    // Without this a flex child refuses to shrink below its content, and the
    // list pushes the profile summary off the bottom of the window.
    minHeight: 0,
  },

  [`& .${classes.content}`]: {
    display: 'flex',
    flexDirection: 'column',
    gap: sidebarMetrics.content.sectionGap,
    paddingTop: sidebarMetrics.content.paddingTop,
    paddingBottom: sidebarMetrics.content.paddingBottom,
  },
}))

export type SidebarComponentProps = IdentityPanelProps &
  ChannelsPanelProps &
  TorStatusProps &
  UserProfilePanelProps &
  DirectMessagesPanelProps & {
    /** Opens the channel-search modal the app already binds to Ctrl/Cmd+K. */
    openSearchModal?: () => void
  }

/**
 * The desktop sidebar, following the Quiet Design Library's "Desktop sidebar"
 * (`5439:58626`, Mode=Dark / Mode=Light) with the V1 content of `6218:16416`.
 */
const SidebarComponent: React.FC<SidebarComponentProps> = ({ ...props }) => {
  return (
    <StyledSidebar className={classes.root} data-testid='sidebar'>
      <div className={classes.header}>
        <div className={classes.windowControls} />
        <IdentityPanel {...props} />
        {props.openSearchModal && <SidebarSearch onClick={props.openSearchModal} />}
      </div>

      <div className={classes.scrollArea}>
        <AutoSizer>
          {({ width, height }) => (
            <Scrollbars
              autoHideTimeout={500}
              style={{ width: width, height: height }}
              renderView={viewProps => <div {...viewProps} style={{ ...viewProps.style, overflowX: 'hidden' }} />}
            >
              <div className={classes.content}>
                <ProminentActionsPanel accountSettingsModal={props.accountSettingsModal} />
                <ChannelsPanel {...props} />
                <DirectMessagesPanel {...props} />
              </div>
            </Scrollbars>
          )}
        </AutoSizer>
      </div>

      <TorStatus isTorInitialized={props.isTorInitialized} />
      <UserProfilePanel {...props} />
    </StyledSidebar>
  )
}

export default SidebarComponent
