import React from 'react'
import { styled } from '@mui/material/styles'

import Button from '@mui/material/Button'

import Modal from '../ui/Modal/Modal'

const PREFIX = 'AgreeAndJoinCard-'
const classes = {
  column: `${PREFIX}column`,
  agreeButton: `${PREFIX}agreeButton`,
}

/** The content column, centred in the window: the 468 the library's modal/small draws (3054:4090). */
const COLUMN_WIDTH = 468

const Root = styled('div')(({ theme }) => ({
  width: '100%',
  boxSizing: 'border-box',
  padding: `0 ${theme.space.lg}px ${theme.space.xxl}px`,
  display: 'flex',
  justifyContent: 'center',
  backgroundColor: theme.palette.background.default,

  [`& .${classes.column}`]: {
    width: COLUMN_WIDTH,
    maxWidth: '100%',
    boxSizing: 'border-box',
    paddingTop: theme.space.xxl,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.space.lg,
  },

  // The library's Button, Large: 50 tall, 12/20 padding; radius 16 and the 16/400 label from the theme.
  [`& .${classes.agreeButton}`]: {
    height: 50,
    padding: `${theme.space.md}px ${theme.space.xl - theme.space.xs}px`,
  },
}))

export interface AgreeAndJoinCardProps {
  open: boolean
  /** Back arrow, backdrop and Escape: the user did not agree. */
  handleClose: () => void
  onAgree: () => void
  /** The left-aligned body, 14/20, naming the host and carrying the policy link. */
  children: React.ReactNode
  /** The button's label; the frame says "Agree & Join". */
  agreeLabel?: string
  testIdPrefix?: string
  bodyTestId?: string
  agreeTestId?: string
}

/**
 * Agree & join · the joiner's consent to the community's server, Figma
 * 3054:4090 (2811:2724 for the joiner copy). A full-window step like the other
 * onboarding stages (user decision, #3690 — the library draws it as the floating
 * modal/small card, which read as a dialog over the app): the titled bar ("Agree &
 * join", back arrow, hairline), a 468 column centred in the window, the body
 * left-aligned, and one Large pill. Nothing else: the back arrow is the way out,
 * which every caller maps to declining.
 *
 * The card is the shell only — each step supplies its own body, because the two
 * that use it are not asking the same question. The terms step asks the joiner
 * to accept the policy; the device-link step has to say what contacting the
 * server exposes.
 */
export const AgreeAndJoinCard: React.FC<AgreeAndJoinCardProps> = ({
  open,
  handleClose,
  onAgree,
  children,
  agreeLabel = 'Agree & Join',
  testIdPrefix = 'AgreeAndJoin',
  bodyTestId = 'agree-and-join',
  agreeTestId = 'agree-and-join-confirm',
}) => (
  <Modal
    open={open}
    handleClose={handleClose}
    title='Agree & join'
    canGoBack
    handleBack={handleClose}
    alignCloseLeft
    addBorder
    contentWidth={'100%'}
    testIdPrefix={testIdPrefix}
  >
    <Root data-testid={bodyTestId}>
      <div className={classes.column}>
        {children}
        <Button
          variant='contained'
          color='primary'
          size='large'
          className={classes.agreeButton}
          onClick={onAgree}
          data-testid={agreeTestId}
        >
          {agreeLabel}
        </Button>
      </div>
    </Root>
  </Modal>
)

export default AgreeAndJoinCard
