import React, { useState } from 'react'
import { styled } from '@mui/material/styles'

import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Button from '@mui/material/Button'

import Modal from '../ui/Modal/Modal'
import { Divider } from '../ui/Divider/Divider'
import ServerBoxIcon from '../ui/assets/icons/ServerBoxIcon'
import { CONTENT_COLUMN_WIDTH } from '../Onboarding/OnboardingBody'

const PREFIX = 'ServerOfferComponent-'
const classes = {
  glyph: `${PREFIX}glyph`,
  icon: `${PREFIX}icon`,
  text: `${PREFIX}text`,
  headingGroup: `${PREFIX}headingGroup`,
  heading: `${PREFIX}heading`,
  pill: `${PREFIX}pill`,
  body: `${PREFIX}body`,
  divider: `${PREFIX}divider`,
  actions: `${PREFIX}actions`,
  useServerButton: `${PREFIX}useServerButton`,
  notNowButton: `${PREFIX}notNowButton`,
  checkboxRow: `${PREFIX}checkboxRow`,
}

/** The frame's glyph zone: a 64 box holding the 48×51 dns glyph. */
const GLYPH_BOX = 64
const GLYPH_WIDTH = 48
const GLYPH_HEIGHT = 51
/** The library's checkbox (3623:11859): a 16 box, radius 3, #999999 hairline; #7F7F7F filled when checked. */
const CHECKBOX_SIZE = 16
/** The pill is 24 tall: 2 above and below its 14/20 label, off the 4px grid by the frame's own measure. */
const PILL_PADDING_Y = 2

/**
 * Want a server? · Figma 2922:10009, measured on the frame: the bar zone with
 * the × glyph and no title, then a 375 column of 24-spaced blocks — the
 * glyph, the text (heading, pill, body), the actions, the full-bleed rule and
 * the checkbox. The column is the prototype's frame width hosted in the modal
 * shell, as every other onboarding stage does; it is not OnboardingBody,
 * because that models a heading/intro pair in a padded column and this frame
 * puts a pill between the two and runs its rule edge to edge.
 */
const Root = styled('div')(({ theme }) => ({
  width: '100%',
  maxWidth: CONTENT_COLUMN_WIDTH,
  margin: '0 auto',
  boxSizing: 'border-box',
  // Content top-anchored 24 under the bar zone, the frame's own 32 at the foot.
  padding: `${theme.space.xl}px 0 ${theme.space.xxl}px`,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.space.xl,
  backgroundColor: theme.palette.background.default,

  [`& .${classes.glyph}`]: {
    width: GLYPH_BOX,
    height: GLYPH_BOX,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  [`& .${classes.icon}`]: {
    width: GLYPH_WIDTH,
    height: GLYPH_HEIGHT,
    color: theme.palette.colors.gray90,
  },

  // The frame pads its text 24 either side; the rule below it is full-bleed.
  [`& .${classes.text}`]: {
    width: '100%',
    boxSizing: 'border-box',
    padding: `0 ${theme.space.xl}px`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.space.lg,
  },
  [`& .${classes.headingGroup}`]: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.space.xs,
  },
  // The frame's ink for the heading, the body and the checkbox label: #222222 (colors.gray90).
  [`& .${classes.heading}`]: {
    color: theme.palette.colors.gray90,
  },
  [`& .${classes.pill}`]: {
    ...theme.typography.subtitle2,
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${PILL_PADDING_Y}px ${theme.space.sm}px`,
    borderRadius: theme.space.xs,
    backgroundColor: theme.palette.colors.lightPurple,
    border: `1px solid ${theme.palette.colors.borderLightPurple}`,
    color: theme.palette.primary.dark,
  },
  [`& .${classes.body}`]: {
    textAlign: 'center',
    color: theme.palette.colors.gray90,
  },

  // The frame's rule runs the full width of the frame, past the text's padding.
  [`& .${classes.divider}`]: {
    alignSelf: 'stretch',
  },

  [`& .${classes.actions}`]: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.space.lg,
  },
  // The library's Button, Large — 50 tall, radius 16 and the 16/400 label come from the theme.
  [`& .${classes.useServerButton}`]: {
    height: 50,
  },
  // "Not now" is a text link on the frame, 16/16 in gray 50, not a second pill.
  [`& .${classes.notNowButton}`]: {
    minHeight: 'auto',
    minWidth: 'auto',
    padding: 0,
    fontSize: 16,
    lineHeight: '16px',
    color: theme.palette.colors.gray50,
    '&:hover': {
      backgroundColor: 'transparent',
      textDecoration: 'underline',
    },
  },

  [`& .${classes.checkboxRow}`]: {
    margin: 0,
    gap: theme.space.sm,
    '& .MuiCheckbox-root': {
      padding: 0,
      color: theme.palette.colors.gray40,
      '&.Mui-checked': {
        color: theme.palette.colors.gray50,
      },
      '& .MuiSvgIcon-root': {
        fontSize: CHECKBOX_SIZE,
      },
    },
    '& .MuiFormControlLabel-label': {
      ...theme.typography.body2,
      color: theme.palette.colors.gray90,
    },
  },
}))

export interface ServerOfferComponentProps {
  open: boolean
  /** An explicit decision: the server, or "Not now", each carrying the checkbox's value. */
  handleClose: (useServer: boolean, dontShowAgain: boolean) => void
  /** The bar glyph, the backdrop and Escape: go back to the step before, deciding nothing. */
  handleBack: () => void
  showDontShowAgain?: boolean
  /** The checkbox's initial state; the component owns it from there. */
  defaultDontShowAgain?: boolean
}

export const ServerOfferComponent: React.FC<ServerOfferComponentProps> = ({
  open,
  handleClose,
  handleBack,
  showDontShowAgain,
  defaultDontShowAgain = false,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(defaultDontShowAgain)

  return (
    <Modal
      open={open}
      handleClose={handleBack}
      withoutTitle
      alignCloseLeft
      closeAriaLabel='Go back'
      testIdPrefix='ServerOffer'
    >
      <Root>
        <div className={classes.glyph}>
          <ServerBoxIcon className={classes.icon} />
        </div>
        <div className={classes.text}>
          <div className={classes.headingGroup}>
            <Typography variant='h3' className={classes.heading}>
              Want a server?
            </Typography>
            <span className={classes.pill}>It’s free!</span>
          </div>
          <Typography variant='body2' className={classes.body}>
            Messages are still end-to-end encrypted, joining will be faster, and Quiet will work much better on iPhones.
          </Typography>
        </div>
        <div className={classes.actions}>
          <Button
            variant='contained'
            color='primary'
            size='large'
            className={classes.useServerButton}
            onClick={() => handleClose(true, dontShowAgain)}
            data-testid='ServerOffer-UseQuietServer'
          >
            Use Quiet’s server
          </Button>
          <Button
            variant='text'
            disableRipple
            className={classes.notNowButton}
            onClick={() => handleClose(false, dontShowAgain)}
            data-testid='ServerOffer-NotNow'
          >
            Not now
          </Button>
        </div>
        {showDontShowAgain && (
          <>
            <Divider className={classes.divider} />
            <FormControlLabel
              className={classes.checkboxRow}
              control={
                <Checkbox
                  color='primary'
                  checked={dontShowAgain}
                  onChange={event => setDontShowAgain(event.target.checked)}
                />
              }
              label='Don’t show this again'
            />
          </>
        )}
      </Root>
    </Modal>
  )
}
