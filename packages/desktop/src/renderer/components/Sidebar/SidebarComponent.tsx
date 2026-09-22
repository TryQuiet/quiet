import React from 'react'
import { styled } from '@mui/material/styles'
import { Scrollbars } from 'rc-scrollbars'
import { AutoSizer } from 'react-virtualized'
import IdentityPanel, { IdentityPanelProps } from './IdentityPanel/IdentityPanel'
import ChannelsPanel, { ChannelsPanelProps } from './ChannelsPanel/ChannelsPanel'
import TorStatus, { TorStatusProps } from './TorStatus'
import UserProfilePanel, { UserProfilePanelProps } from './UserProfilePanel/UserProfilePanel'
import DirectMessagesPanel, { DirectMessagesPanelProps } from './DirectMessagesPanel/DirectMessagesPanel'
import { headerTopInset, sidebarMetrics } from '../ui/Sidebar/sidebarMetrics'

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

  // The strip the sidebar leaves clear for the window's own controls on macOS;
  // on Windows and Linux only the inset that aligns the community row with the
  // channel header (see `headerTopInset`).
  [`& .${classes.windowControls}`]: {
    height: headerTopInset(),
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
  DirectMessagesPanelProps

/**
 * The desktop sidebar, following the Quiet Design Library's V1 variant
 * "Mode=Desktop sidebar - V1 release, Content=For V1 2025" (`6218:16416`).
 *
 * The library's full component set (`5439:58626`) puts a search field under the
 * community row; V1 does not ("Top bar without search", `6222:13638`), and the
 * app's channel search stays on Ctrl/Cmd+K.
 *
 * V1 also draws an "Add members" row above the channel list. The app does not:
 * Add members lives in the community menu, the settings drawer the community
 * name and caret open (user decision, 2026-09-22). The designer's own desktop
 * app frame draws it there too (`1430:48372`, exported as
 * `design-system/figma/desktop/desktop-community-menu-open.png`).
 */
const SidebarComponent: React.FC<SidebarComponentProps> = ({ ...props }) => {
  return (
    <StyledSidebar className={classes.root} data-testid='sidebar'>
      <div className={classes.header}>
        <div className={classes.windowControls} />
        <IdentityPanel {...props} />
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
