import React from 'react'

import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'

import ProfilePhoto from '../../ProfilePhoto/ProfilePhoto'
import { UserProfile } from '@quiet/types'

/**
 * A recipient the user has already picked, shown inside the "To:" field.
 *
 * Geometry comes from the DM design library component "Members and roles"
 * (Figma tXuRsUfP6VnSv99dox00C1, 919:47856): 26 tall, radius 8, 8px of horizontal padding and an
 * 8px gap, on #F7F7F7 that goes to #F0F0F0 on hover. The avatar is always drawn — the design has no
 * variant without one, and ProfilePhoto falls back to a Jdenticon for members with no photo. The
 * close glyph is #A1A1A1 and darkens to #4C4C4C when it is itself hovered, which is why the design
 * carries separate "Hover" and "Hover icon" variants.
 */
export const PILL_HEIGHT = 26
export const PILL_RADIUS = 8
export const PILL_AVATAR_SIZE = 16
/** Gap between pills, across and down, per "Search states / State=Selected (2)" (919:48416). */
export const PILL_ROW_GAP = 10

const CLOSE_COLOR = '#A1A1A1'

const PREFIX = 'RecipientPill'

const classes = {
  root: `${PREFIX}root`,
  avatar: `${PREFIX}avatar`,
  label: `${PREFIX}label`,
  close: `${PREFIX}close`,
}

const StyledPill = styled('div')(({ theme }) => ({
  [`&.${classes.root}`]: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    height: PILL_HEIGHT,
    padding: '1px 8px',
    borderRadius: PILL_RADIUS,
    backgroundColor: theme.palette.colors.gray03,
    maxWidth: '100%',
  },

  [`&.${classes.root}:hover`]: {
    backgroundColor: theme.palette.colors.border01,
  },

  [`& .${classes.avatar}`]: {
    flexShrink: 0,
    borderRadius: 4,
  },

  [`& .${classes.label}`]: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    // A nickname can be far longer than the design's placeholder; cap it so one recipient cannot
    // push the ✕ out of the field.
    maxWidth: 200,
    // Left to inherit: the design's #333333 is the light-theme body colour, and inheriting keeps
    // the pill legible in the dark theme too.
  },

  [`& .${classes.close}`]: {
    flexShrink: 0,
    display: 'flex',
    cursor: 'pointer',
    fontSize: PILL_AVATAR_SIZE,
    color: CLOSE_COLOR,
    '&:hover': {
      color: theme.palette.colors.gray70,
    },
  },
}))

export interface RecipientPillProps {
  userProfile: UserProfile | undefined
  userId: string
  label: string
  onDelete?: (event: React.SyntheticEvent) => void
}

export const RecipientPill: React.FC<RecipientPillProps> = ({ userProfile, userId, label, onDelete }) => {
  return (
    <StyledPill className={classes.root} data-testid={`new-message-recipient-pill-${label}`}>
      <ProfilePhoto
        className={classes.avatar}
        userProfile={userProfile}
        userId={userId}
        size={PILL_AVATAR_SIZE}
        alt={`${label}'s profile image`}
      />
      <Typography variant='body2' className={classes.label}>
        {label}
      </Typography>
      {onDelete && (
        <CloseIcon
          className={classes.close}
          fontSize='inherit'
          role='button'
          aria-label={`Remove ${label}`}
          data-testid={`new-message-recipient-pill-remove-${label}`}
          onClick={onDelete}
        />
      )}
    </StyledPill>
  )
}

export default RecipientPill
