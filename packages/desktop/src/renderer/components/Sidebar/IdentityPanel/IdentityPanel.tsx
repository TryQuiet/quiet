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
    padding: `0 ${sidebarMetrics.header.paddingX}px`,
  },

  [`& .${classes.button}`]: {
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    minHeight: sidebarMetrics.header.teamRowHeight,
    gap: sidebarMetrics.header.teamGap,
    padding: 0,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    color: theme.palette.colors.white,
    '&:hover': {
      [`& .${classes.nickname}, & .${classes.caret}`]: {
        opacity: sidebarMetrics.opacity.hover,
      },
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
 * The "Team" row at the top of the Quiet Design Library's desktop sidebar
 * (`6218:16416`): the community's letter tile, its name, and a caret.
 *
 * The caret opens what the community header has always opened, the community
 * settings drawer. The library also puts an unread bubble on the tile; Quiet has
 * one community per window and no unread counts, so there is nothing to put in
 * it and it is left out.
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
          accountSettingsModal.handleOpen()
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
