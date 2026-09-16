import React, { useEffect, useMemo, useState } from 'react'

import { styled } from '@mui/material/styles'
import { Checkbox, Drawer, Typography } from '@mui/material'

import { useModal } from '../../../containers/hooks'
import { User, UserProfile } from '@quiet/types'
import PanelHeader, { PANEL_INSET, PANEL_WIDTH } from '../../ui/Panel/PanelHeader'
import PillField from '../../ui/Panel/PillField'
import RecipientPill from '../../widgets/userSearch/RecipientPill'
import ProfilePhoto from '../../ProfilePhoto/ProfilePhoto'
import { createLogger } from '../../../logger'

const logger = createLogger('AddMembersChannelComponent')

/**
 * The second step of setting up a private channel: choosing who is in it.
 *
 * Laid out after "Add members or roles" (Figma PVQ1Kjf6Cq8ng1czuVtvR8, 838:9305): a close and a
 * Done in the title bar rather than a back arrow, the channel it is acting on as the bar's
 * subtitle, the people picked so far as pills inside a radius-16 search box with its caption
 * beneath, and the rest listed below with a checkbox and a thumbnail each.
 *
 * The design also lists roles; there are none yet, so only the members section is built. Its
 * heading is kept so the section reads the same when roles arrive.
 */
const TITLE = 'Add members or roles'
const SEARCH_PLACEHOLDER = 'E.g. @jane123'
const SEARCH_CAPTION = "Add members with '@'"
const MEMBERS_HEADING = 'MEMBERS'
const NO_MEMBERS = 'Everyone in this community is already in this channel.'

const PREFIX = 'AddMembersChannel'

const classes = {
  content: `${PREFIX}content`,
  block: `${PREFIX}block`,
  heading: `${PREFIX}heading`,
  row: `${PREFIX}row`,
  name: `${PREFIX}name`,
  empty: `${PREFIX}empty`,
}

const StyledPanelContent = styled('div')(({ theme }) => ({
  [`&.${classes.content}`]: {
    backgroundColor: theme.palette.background.default,
  },

  // The search box and its caption are inset; the rows below run full bleed.
  [`& .${classes.block}`]: {
    padding: PANEL_INSET,
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
    cursor: 'pointer',
    borderTop: `1px solid ${theme.palette.colors.border01}`,
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

export interface AddMembersChannelProps {
  channelName: string
  channelId: string
  allUsers: Record<string, User>
  possibleMembers: Record<string, UserProfile>
  addMembersToChannel: (memberIds: string[]) => void
}

export const AddMembersChannelComponent: React.FC<ReturnType<typeof useModal> & AddMembersChannelProps> = ({
  open,
  handleClose,
  channelName,
  channelId,
  possibleMembers,
  addMembersToChannel,
}) => {
  const [selected, setSelected] = useState<string[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!open) {
      setSelected([])
      setQuery('')
    }
  }, [open])

  /** Everyone who is not in the channel already. */
  const candidates = useMemo(
    () => Object.values(possibleMembers).filter(member => !(member.channels ?? []).includes(channelId)),
    [possibleMembers, channelId]
  )

  const listed = useMemo(() => {
    const needle = query.replace('@', '').toLowerCase()
    if (!needle) return candidates
    return candidates.filter(member => member.nickname.toLowerCase().includes(needle))
  }, [candidates, query])

  const toggle = (userId: string) =>
    setSelected(current => (current.includes(userId) ? current.filter(id => id !== userId) : [...current, userId]))

  const handleDone = () => {
    logger.debug(`Adding ${selected.length} members to ${channelName}`)
    addMembersToChannel(selected)
    setSelected([])
    setQuery('')
  }

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      anchor='right'
      data-testid={'addMembersPanel'}
      PaperProps={{ sx: { width: PANEL_WIDTH } }}
    >
      <StyledPanelContent className={classes.content}>
        <PanelHeader
          title={TITLE}
          subtitle={`#${channelName}`}
          handleClose={handleClose}
          // A cross and a Done, not a back arrow: this step is confirmed or cancelled.
          leading={'close'}
          action={{
            label: 'Done',
            onClick: handleDone,
            testId: `${channelName}-add-members-button`,
            disabled: selected.length === 0,
          }}
          closeTestId={`${channelName}-add-members-leave-button`}
          titleTestId={'addMembersPanelTitle'}
        />
        <div className={classes.block}>
          <PillField
            testId={`${channelName}-add-members-search`}
            value={query}
            onChange={setQuery}
            placeholder={selected.length > 0 ? undefined : SEARCH_PLACEHOLDER}
            caption={SEARCH_CAPTION}
            autoFocus
            pills={selected.map(userId => (
              <RecipientPill
                key={userId}
                userProfile={possibleMembers[userId]}
                userId={userId}
                label={possibleMembers[userId]?.nickname ?? userId}
                onDelete={() => toggle(userId)}
              />
            ))}
          />
        </div>
        {candidates.length === 0 ? (
          <Typography className={classes.empty} data-testid={`${channelName}-add-members-empty`}>
            {NO_MEMBERS}
          </Typography>
        ) : (
          <>
            <Typography className={classes.heading}>{MEMBERS_HEADING}</Typography>
            {listed.map(member => (
              <div
                key={member.userId}
                className={classes.row}
                onClick={() => toggle(member.userId)}
                data-testid={`${channelName}-add-members-row-${member.nickname}`}
              >
                <Checkbox
                  checked={selected.includes(member.userId)}
                  disableRipple
                  sx={{ padding: 0 }}
                  inputProps={
                    {
                      'data-testid': `${channelName}-add-members-checkbox-${member.nickname}`,
                    } as React.InputHTMLAttributes<HTMLInputElement>
                  }
                />
                <ProfilePhoto userProfile={member} userId={member.userId} size={37} />
                <Typography className={classes.name}>{member.nickname}</Typography>
              </div>
            ))}
          </>
        )}
      </StyledPanelContent>
    </Drawer>
  )
}

export default AddMembersChannelComponent
