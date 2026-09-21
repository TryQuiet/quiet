import React from 'react'
import classNames from 'classnames'

import { styled } from '@mui/material/styles'
import { Button, Typography } from '@mui/material'
import Drawer from '../../ui/Drawer/Drawer'

import { useModal } from '../../../containers/hooks'
import { UserProfile } from '@quiet/types'
import PanelHeader, { PANEL_INSET, PANEL_WIDTH } from '../../ui/Panel/PanelHeader'
import ProfilePhotoWithBadge from '../../ProfilePhoto/ProfilePhotoWithBadge'
import { ProfilePhotoSize } from '../../ProfilePhoto/ProfilePhoto.types'
import { isMemberConnected, type IsUserConnected } from '@quiet/common'

/**
 * Who belongs to a channel.
 *
 * One panel for everyone (Figma PVQ1Kjf6Cq8ng1czuVtvR8, 838:9386 for the desktop menu, 838:9394
 * for the panel): it lists who belongs, and an admin additionally gets the action that adds more.
 *
 * The design calls the admin's version "Permissions", because there it governs roles as well as
 * people. Ours governs only people, so it is named for what it does. WHEN ROLES SHIP, this becomes
 * two surfaces again and the admin's takes the design's name.
 *
 * The design's Permissions panel also lists roles and puts a remove control on each row. There are
 * no roles yet, and the state manager has no action for removing a member — only
 * addMembersChannel — so neither is built.
 */

/**
 * The channel menu's row names the surface it opens; the panel, once open, only has to name itself.
 * So the row keeps the descriptive form and the panel is just "Members" — matching mobile, which
 * has always titled it that way. The row constants are exported because the row and the panel must
 * not drift apart about what this surface is; the stories use them too.
 */
export const MEMBERS_IN_CHANNEL_TITLE = 'Members in this channel'
export const MEMBERS_IN_DM_TITLE = 'Members in this DM'
const MEMBERS_PANEL_TITLE = 'Members'

const MEMBERS_HEADING = 'MEMBERS'
const ADD_MEMBERS = 'Add members'
const NO_MEMBERS = 'Nobody has been added to this channel yet.'

const PREFIX = 'ChannelMembership'

const classes = {
  content: `${PREFIX}content`,
  action: `${PREFIX}action`,
  heading: `${PREFIX}heading`,
  row: `${PREFIX}row`,
  rowLink: `${PREFIX}rowLink`,
  name: `${PREFIX}name`,
  empty: `${PREFIX}empty`,
}

const StyledPanelContent = styled('div')(({ theme }) => ({
  [`&.${classes.content}`]: {
    backgroundColor: theme.palette.background.default,
  },

  // The design puts the action in its own inset block above the list, right-aligned.
  [`& .${classes.action}`]: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: PANEL_INSET,
    borderBottom: `1px solid ${theme.palette.colors.border01}`,
  },

  [`& .${classes.heading}`]: {
    padding: `18px ${PANEL_INSET}px 6px`,
    fontSize: 12,
    lineHeight: '16px',
    letterSpacing: '0.4px',
    color: theme.palette.colors.gray50,
  },

  [`& .${classes.row}`]: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minHeight: 55,
    padding: `0 ${PANEL_INSET}px`,
    borderTop: `1px solid ${theme.palette.colors.border01}`,
  },

  // The row leads to the member's profile; the design system's row hover is #F0F0F0 (Quiet Design
  // Library, Panel row 2989:185).
  [`& .${classes.rowLink}`]: {
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.colors.border01,
    },
  },

  [`& .${classes.name}`]: {
    fontSize: 16,
    lineHeight: '26px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  [`& .${classes.empty}`]: {
    padding: PANEL_INSET,
    fontSize: 14,
    lineHeight: '20px',
    fontStyle: 'italic',
    color: theme.palette.colors.gray50,
  },
}))

export interface ChannelMembershipProps {
  /** A channel's `name`; a DM's `displayedName`, which is the participants it is drawn from. */
  channelName: string
  /** A DM names itself by its participants, so it takes neither the "#" nor the word "channel". */
  isDm: boolean
  members: UserProfile[]
  /** Presence by user id; a linked device counts as the same user. See connection.selectors. */
  isUserConnected: IsUserConnected
  /** My own row cannot be answered by a peer connection, so it follows Tor. */
  myUserId?: string
  isTorInitialized: boolean
  /** An admin additionally gets the button that adds members; everyone else sees the list alone. */
  canManage: boolean
  openAddMembers: () => void
  /** Opens a member's profile. This list only shows who belongs, so a click means nothing else
   *  here — unlike the add-members list, where a click selects. */
  openUserProfile?: (userId: string) => void
}

export const ChannelMembershipComponent: React.FC<ReturnType<typeof useModal> & ChannelMembershipProps> = ({
  open,
  handleClose,
  channelName,
  isDm,
  members,
  isUserConnected,
  myUserId,
  isTorInitialized,
  canManage,
  openAddMembers,
  openUserProfile,
}) => {
  return (
    <Drawer
      open={open}
      onClose={handleClose}
      anchor='right'
      data-testid={'channelMembershipPanel'}
      PaperProps={{ sx: { width: PANEL_WIDTH } }}
    >
      <StyledPanelContent className={classes.content}>
        <PanelHeader
          title={MEMBERS_PANEL_TITLE}
          // A channel's name is worth repeating here; a DM's is not, because a DM is named by its
          // participants and the list below is those same people. The subtitle slot was inherited
          // from the channel panel and had nothing DM-shaped to hold.
          subtitle={isDm ? undefined : `#${channelName}`}
          handleClose={handleClose}
          leading={'back'}
          closeTestId={'channelMembershipPanelClose'}
          titleTestId={'channelMembershipPanelTitle'}
        />
        {canManage && (
          <div className={classes.action}>
            <Button onClick={openAddMembers} data-testid={'channelMembershipAddMembers'} variant='contained'>
              {ADD_MEMBERS}
            </Button>
          </div>
        )}
        {members.length === 0 ? (
          <Typography className={classes.empty} data-testid={'channelMembershipEmpty'}>
            {NO_MEMBERS}
          </Typography>
        ) : (
          <>
            <Typography className={classes.heading}>{MEMBERS_HEADING}</Typography>
            {members.map(member => (
              <div
                key={member.userId}
                className={classNames(classes.row, { [classes.rowLink]: openUserProfile != null })}
                onClick={() => openUserProfile?.(member.userId)}
                data-testid={`channelMembershipRow-${member.nickname}`}
              >
                <ProfilePhotoWithBadge
                  size={ProfilePhotoSize.MEDIUM}
                  userData={{
                    user: member,
                    connected: isMemberConnected(member.userId, myUserId, isUserConnected, isTorInitialized),
                  }}
                />
                <Typography className={classes.name}>{member.nickname}</Typography>
              </div>
            ))}
          </>
        )}
      </StyledPanelContent>
    </Drawer>
  )
}

export default ChannelMembershipComponent
