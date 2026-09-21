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
/** Press target for the pill's ✕, per the design's 24 close-small box. */
const PILL_CLOSE_TARGET = 24

const CLOSE_COLOR = '#A1A1A1'
/** The design's #F7F7F7 / #F0F0F0 are light-theme values; these are their dark-theme counterparts. */
const PILL_BACKGROUND_DARK = 'rgba(255,255,255,0.08)'
const PILL_HOVER_DARK = 'rgba(255,255,255,0.14)'

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
    // gray03 and border01 are the same near-white in both palettes, so on the dark theme this was
    // a white chip carrying inherited white text — the pill read as empty. Dark mode gets a light
    // wash over the dark panel instead, which keeps the inherited label legible.
    backgroundColor: theme.palette.mode === 'dark' ? PILL_BACKGROUND_DARK : theme.palette.colors.gray03,
    maxWidth: '100%',
  },

  [`&.${classes.root}:hover`]: {
    backgroundColor: theme.palette.mode === 'dark' ? PILL_HOVER_DARK : theme.palette.colors.border01,
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
    // Left to inherit, which is correct now the pill's own ground follows the theme: dark text on
    // the light wash, light text on the dark one.
  },

  // The design's close-small is a 24 box around a ~10 glyph (838:9308); drawing the glyph at its own
  // size made the press target the glyph. Box it back out to 24 without changing what is drawn.
  [`& .${classes.close}`]: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'content-box',
    width: PILL_CLOSE_TARGET,
    height: PILL_CLOSE_TARGET,
    margin: -((PILL_CLOSE_TARGET - PILL_AVATAR_SIZE) / 2),
    cursor: 'pointer',
    fontSize: PILL_AVATAR_SIZE,
    color: CLOSE_COLOR,
    // The design darkens the ✕ on hover, which is the wrong direction against a dark panel; there
    // it brightens instead. Either way the resting grey is the design's #A1A1A1.
    '&:hover': {
      color: theme.palette.mode === 'dark' ? theme.palette.colors.white : theme.palette.colors.gray70,
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
