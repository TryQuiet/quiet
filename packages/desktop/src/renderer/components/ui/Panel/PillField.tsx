import React from 'react'

import { InputBase, Typography } from '@mui/material'
import { styled } from '@mui/material/styles'

/**
 * A bordered box holding the things already chosen as pills, with room to keep typing.
 *
 * Transcribed from "Search input" in the add-members panel (Figma PVQ1Kjf6Cq8ng1czuVtvR8
 * 838:9308): radius 16 inside a #E5E5E5 hairline, 16 of horizontal padding and 8 of vertical, an 8
 * gap to the input and 4 between pills, which wrap onto further lines. The caption beneath sits 4
 * below it, at 12/16 (838:9309).
 */
export const PILL_FIELD_RADIUS = 16
export const PILL_FIELD_GAP = 8
export const PILL_FIELD_PILL_GAP = 4
export const PILL_FIELD_CAPTION_GAP = 4

const PREFIX = 'PillField'

const classes = {
  root: `${PREFIX}root`,
  box: `${PREFIX}box`,
  pills: `${PREFIX}pills`,
  input: `${PREFIX}input`,
  caption: `${PREFIX}caption`,
}

const StyledPillField = styled('div')(({ theme }) => ({
  [`&.${classes.root}`]: {
    display: 'flex',
    flexDirection: 'column',
    gap: PILL_FIELD_CAPTION_GAP,
    width: '100%',
  },

  [`& .${classes.box}`]: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: PILL_FIELD_GAP,
    minHeight: 48,
    padding: '8px 16px',
    borderRadius: PILL_FIELD_RADIUS,
    border: `1px solid #E5E5E5`,
    backgroundColor: theme.palette.background.default,
  },

  [`& .${classes.pills}`]: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: PILL_FIELD_PILL_GAP,
  },

  [`& .${classes.input}`]: {
    flexGrow: 1,
    minWidth: 96,
    fontSize: 14,
    lineHeight: '20px',
    '& input': {
      padding: 0,
    },
    '& input::placeholder': {
      color: theme.palette.colors.gray50,
      opacity: 1,
    },
  },

  [`& .${classes.caption}`]: {
    fontSize: 12,
    lineHeight: '16px',
    padding: '0 8px',
    color: theme.palette.colors.gray40,
  },
}))

export interface PillFieldProps {
  /** The pills already chosen; render these with RecipientPill. */
  pills?: React.ReactNode
  value?: string
  placeholder?: string
  caption?: string
  onChange?: (value: string) => void
  autoFocus?: boolean
  testId?: string
}

export const PillField: React.FC<PillFieldProps> = ({
  pills,
  value,
  placeholder,
  caption,
  onChange,
  autoFocus,
  testId,
}) => {
  return (
    <StyledPillField className={classes.root}>
      <div className={classes.box} data-testid={testId}>
        {pills && <span className={classes.pills}>{pills}</span>}
        <InputBase
          className={classes.input}
          value={value}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onChange={event => onChange?.(event.target.value)}
          inputProps={{ 'data-testid': testId ? `${testId}-input` : undefined }}
        />
      </div>
      {caption && <Typography className={classes.caption}>{caption}</Typography>}
    </StyledPillField>
  )
}

export default PillField
