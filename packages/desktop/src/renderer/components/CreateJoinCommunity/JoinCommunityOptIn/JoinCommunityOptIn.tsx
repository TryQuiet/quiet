import React, { useState } from 'react'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Modal from '../../ui/Modal/Modal'
import { LoadingButton } from '../../ui/LoadingButton/LoadingButton'
import { useForm } from 'react-hook-form'
import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
import { createLogger } from '../../../logger'
import { Site } from '@quiet/common'

// Fix for electron import in storybook
const mockShell = {
  openExternal: (url: string) => {
    console.log('Opening URL:', url)
  },
}

// Conditionally import electron only in non-storybook environment
let shell: typeof mockShell
try {
  // This will fail in storybook
  shell = require('electron').shell
} catch (error) {
  // Use mock in storybook
  shell = mockShell
}

// Augment the MUI Palette type to include the colors property
declare module '@mui/material/styles' {
  interface Palette {
    colors: {
      quietBlue: string
      white: string
      darkGray: string
      linkBlue: string
      [key: string]: string
    }
  }
}

const logger = createLogger('joinCommunityOptIn:component')

const PREFIX = 'JoinCommunityOptIn'

const classes = {
  fullContainer: `${PREFIX}fullContainer`,
  gutter: `${PREFIX}gutter`,
  button: `${PREFIX}button`,
  title: `${PREFIX}title`,
  description: `${PREFIX}description`,
}

const StyledModalContent = styled(Grid)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  padding: '0px 32px',

  [`& .${classes.fullContainer}`]: {
    width: '100%',
  },

  [`& .${classes.gutter}`]: {
    marginTop: 8,
    marginBottom: 24,
  },

  [`& .${classes.button}`]: {
    width: 165,
    backgroundColor: theme.palette.colors.quietBlue,
    color: theme.palette.colors.white,
    '&:hover': {
      backgroundColor: theme.palette.colors.quietBlue,
    },
    textTransform: 'none',
    height: 48,
    fontWeight: 'normal',
  },

  [`& .${classes.title}`]: {
    marginBottom: 24,
  },

  [`& .${classes.description}`]: {
    marginBottom: 24,
    color: theme.palette.text.primary,
    lineHeight: theme.typography.body1.lineHeight,
  },

  [`& .${classes.description} a`]: {
    color: theme.palette.colors.linkBlue,
    textDecoration: 'none',
  },
}))

interface JoinCommunityOptInFormValues {
  optIn: boolean
}

export interface JoinCommunityOptInProps {
  open: boolean
  handleClose: () => void
  handleOptIn: (optedIn: boolean) => void
  isLoading?: boolean
  openUrl: (url: string) => void
}

export const JoinCommunityOptInComponent: React.FC<JoinCommunityOptInProps> = ({
  open,
  handleClose,
  handleOptIn,
  openUrl,
  isLoading = false,
}) => {
  const { handleSubmit } = useForm<JoinCommunityOptInFormValues>({
    defaultValues: {
      optIn: false,
    },
  })

  const onSubmit = () => {
    logger.info('User agreed to join')
    handleOptIn(true)
  }

  return (
    <Modal open={open} handleClose={handleClose}>
      <StyledModalContent container direction='column'>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container justifyContent='flex-start' direction='column' className={classes.fullContainer}>
            <Typography variant='h3' className={classes.title}>
              Agree & Join
            </Typography>
            <Typography variant='body1' className={classes.description}>
              This community uses a server (api.tryquiet.org). By joining you agree to this{' '}
              <a
                onClick={() => openUrl(`${Site.MAIN_PAGE}${Site.PRIVACY_TOS_PAGE}`)}
                target='_blank'
                rel='noopener noreferrer'
                style={{ cursor: 'pointer' }}
              >
                Privacy Policy and Terms of Use
              </a>
              . (Note: server connection is not via Tor!)
            </Typography>
          </Grid>
          <LoadingButton
            type='submit'
            variant='contained'
            size='small'
            color='primary'
            fullWidth
            text='Agree & Join'
            data-testid='join-community-opt-in-button'
            classes={{ button: classes.button }}
            inProgress={isLoading}
          />
        </form>
      </StyledModalContent>
    </Modal>
  )
}

const JoinCommunityOptIn = () => {
  const [isLoading, setIsLoading] = useState(false)
  const joinCommunityOptInModal = useModal(ModalName.joinCommunityOptInModal)

  const handleOptIn = (optedIn: boolean) => {
    setIsLoading(true)
    // Here you would dispatch an action to save the user's preference
    // For now, we just log it and close the modal after a delay
    logger.info('User opted in to QSS:', optedIn)

    // Simulate an API call
    setTimeout(() => {
      setIsLoading(false)
      joinCommunityOptInModal.handleClose()
    }, 1000)
  }

  const handleOpenUrl = (url: string) => {
    shell.openExternal(url)
  }

  return (
    <JoinCommunityOptInComponent
      {...joinCommunityOptInModal}
      handleOptIn={handleOptIn}
      isLoading={isLoading}
      openUrl={handleOpenUrl}
    />
  )
}

export default JoinCommunityOptIn
