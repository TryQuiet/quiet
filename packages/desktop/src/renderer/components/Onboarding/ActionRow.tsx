import React from 'react'
import { styled } from '@mui/material/styles'
import ListItemButton from '@mui/material/ListItemButton'
import Typography from '@mui/material/Typography'

import { onboardingIcons } from './icons'

const PREFIX = 'ActionRow'

const classes = {
  icon: `${PREFIX}icon`,
  text: `${PREFIX}text`,
  caret: `${PREFIX}caret`,
}

/**
 * The design library's "Button row": icon · label (· subtitle) · caret, with a
 * hairline below. Every distance is a spacing role on the 4px grid and every
 * text style a theme variant, so the row reads the same on both platforms.
 */
const StyledRow = styled(ListItemButton)(({ theme }) => ({
  paddingTop: theme.space.md,
  paddingBottom: theme.space.md,
  paddingLeft: 0,
  paddingRight: 0,
  gap: theme.space.md,
  borderBottom: `1px solid ${theme.palette.colors.border01}`,
  [`& .${classes.icon}`]: {
    width: 24,
    height: 24,
    flex: '0 0 24px',
  },
  [`& .${classes.text}`]: {
    flex: 1,
    minWidth: 0,
  },
  [`& .${classes.caret}`]: {
    width: 24,
    height: 24,
    flex: '0 0 24px',
  },
  '&.Mui-disabled': {
    opacity: 0.4,
  },
}))

export interface ActionRowProps {
  icon: string
  label: string
  subtitle?: string
  onClick?: () => void
  disabled?: boolean
  dataTestId?: string
}

export const ActionRow: React.FC<ActionRowProps> = ({ icon, label, subtitle, onClick, disabled, dataTestId }) => (
  <StyledRow onClick={onClick} disabled={disabled} data-testid={dataTestId} disableGutters>
    <img className={classes.icon} src={icon} alt='' aria-hidden />
    <div className={classes.text}>
      <Typography variant='body1'>{label}</Typography>
      {subtitle ? (
        <Typography variant='caption' component='div'>
          {subtitle}
        </Typography>
      ) : null}
    </div>
    <img className={classes.caret} src={onboardingIcons.caretRight} alt='' aria-hidden />
  </StyledRow>
)

export default ActionRow
