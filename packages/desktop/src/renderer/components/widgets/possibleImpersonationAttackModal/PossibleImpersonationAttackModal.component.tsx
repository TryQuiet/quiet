import React from 'react'
import Modal from '../../ui/Modal/Modal'
import { Button, Grid, Typography } from '@mui/material'
import { styled } from '@mui/material/styles'
import WarnIcon from '../../../static/images/exclamationMark.svg'

const PREFIX = 'PossibleImpersonationAttackModalComponent-'

const classes = {
  bodyText: `${PREFIX}bodyText`,
  button: `${PREFIX}button`,
  image: `${PREFIX}image`,
}

const StyledGrid = styled(Grid)(({ theme }) => ({
  [`& .${classes.bodyText}`]: {
    textAlign: 'center',
    width: '65%',
    margin: '24px 0 4px',
  },
  [`& .${classes.image}`]: {
    width: '70px',
    height: '70px',
    margin: '30px 0 24px',
  },
  [`& .${classes.button}`]: {
    marginTop: 16,
    textTransform: 'none',
    padding: '0 24px',
    height: 40,
    borderRadius: '8px',
    color: theme.palette.colors.white,
    backgroundColor: theme.palette.colors.quietBlue,
    '&:hover': {
      opacity: 0.7,
      backgroundColor: theme.palette.colors.quietBlue,
    },
  },
}))

export interface PossibleImpersonationAttackModalComponentProps {
  communityName: string
  open: boolean
  handleClose: () => void
}

const PossibleImpersonationAttackModalComponent: React.FC<PossibleImpersonationAttackModalComponentProps> = ({
  communityName,
  handleClose,
  open,
}) => {
  return (
    <Modal open={open} handleClose={handleClose} title={'Warning!'} isBold addBorder>
      <StyledGrid
        container
        item
        direction='column'
        justifyContent='flex-start'
        alignItems='center'
        data-testid={'possible-impersonation-attack-modal-component'}
      >
        <img className={classes.image} src={WarnIcon} />
        <Typography variant='h4'>Possible impersonation attack</Typography>
        <Typography className={classes.bodyText} variant='body2'>
          The owner of <strong>{communityName}</strong> has registered an invalid username. Either something is very
          broken, the community owner is trying to impersonate other users, or the community owner has been hacked.
          <br />
          <strong>This should never happen and we recommend leaving this community immediately!</strong>
        </Typography>
        {/* Temporarily hiding button - https://github.com/TryQuiet/quiet/issues/2025 , https://github.com/TryQuiet/quiet/pull/2037/commits/499a12ff5494611af5d302244bc05024bcbc4c82*/}
      </StyledGrid>
    </Modal>
  )
}

export default PossibleImpersonationAttackModalComponent
