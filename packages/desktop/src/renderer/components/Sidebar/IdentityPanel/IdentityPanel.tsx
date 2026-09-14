import React from 'react'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { useModal } from '../../../containers/hooks'
import { Community } from '@quiet/types'
import CommunityIcon from '../../ui/Sidebar/CommunityIcon'
import { CaretDownIcon } from '../../ui/Sidebar/sidebarIcons'
import { sidebarMetrics } from '../../ui/Sidebar/sidebarMetrics'

const PREFIX = 'IdentityPanel'

const classes = {
  root: `${PREFIX}root`,
  button: `${PREFIX}button`,
  nameGroup: `${PREFIX}nameGroup`,
  nickname: `${PREFIX}nickname`,
  caret: `${PREFIX}caret`,
}

const StyledIdentityPanel = styled('div')(({ theme }) => ({
  [`&.${classes.root}`]: {
    boxSizing: 'border-box',
    width: '100%',
  },

  // `Team` (`4233:12959`) is a 220-wide row with 16px side padding. The padding
  // is on the button rather than a wrapper so the pressed overlay spans the
  // whole column, the way every other row's does.
  [`& .${classes.button}`]: {
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    minHeight: sidebarMetrics.header.teamRowHeight,
    gap: sidebarMetrics.header.teamGap,
    padding: `0 ${sidebarMetrics.header.paddingX}px`,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    color: theme.palette.colors.white,
    // `Team` has no Hover or Pressed variant in the library, so hovering only
    // brings the name and caret up to full opacity, and pressing reuses the
    // Selected overlay rather than inventing a colour.
    '&:hover': {
      [`& .${classes.nickname}, & .${classes.caret}`]: {
        opacity: sidebarMetrics.opacity.hover,
      },
    },
    '&:active': {
      backgroundColor: sidebarMetrics.overlay.pressed,
    },
  },

  [`& .${classes.nameGroup}`]: {
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
    gap: sidebarMetrics.header.nameCaretGap,
  },

  [`& .${classes.nickname}`]: {
    opacity: sidebarMetrics.opacity.communityName,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: theme.palette.colors.white,
  },

  [`& .${classes.caret}`]: {
    flexShrink: 0,
    display: 'flex',
    width: sidebarMetrics.header.caret,
    height: sidebarMetrics.header.caret,
    opacity: sidebarMetrics.opacity.caret,
  },
}))

export interface IdentityPanelProps {
  currentCommunity: Community
  accountSettingsModal: ReturnType<typeof useModal>
}

/**
 * `Team` (`4233:12959`, Type=Community) at the top of the desktop sidebar: the
 * community's letter tile, its name, and a caret.
 *
 * The caret opens what the community header has always opened, the community
 * settings drawer. The library also hangs an unread bubble off the tile
 * (`Community home/Badge--community`, "99+"); Quiet counts no messages, so
 * there is no number to put in it and it is left out, as the channel badges'
 * counts are. The set's Placeholder variant is a skeleton, which the app has no
 * state for: the sidebar renders nothing until there is a community.
 */
export const IdentityPanel: React.FC<IdentityPanelProps> = ({ currentCommunity, accountSettingsModal }) => {
  const communityName = currentCommunity?.name || '...'
  return (
    <StyledIdentityPanel className={classes.root}>
      <button
        type='button'
        className={classes.button}
        onClick={event => {
          event.persist()
          // Explicitly empty: the modal reducer keeps the previous args when a
          // caller passes none, so opening with nothing would inherit whatever
          // tab the last caller asked for - "Add members" asks for 'invite'.
          accountSettingsModal.handleOpen({})
        }}
        data-testid={'settings-panel-button'}
      >
        <CommunityIcon name={communityName} />
        <span className={classes.nameGroup}>
          <Typography variant='h4' className={classes.nickname} data-testid='current-community-name'>
            {communityName}
          </Typography>
          <span className={classes.caret}>
            <CaretDownIcon />
          </span>
        </span>
      </button>
    </StyledIdentityPanel>
  )
}

export default IdentityPanel
