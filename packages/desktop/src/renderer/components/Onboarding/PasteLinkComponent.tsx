import React, { useEffect } from 'react'
import { styled } from '@mui/material/styles'
import classNames from 'classnames'
import { Controller, useForm } from 'react-hook-form'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'

import { getInvitationCodes } from '@quiet/state-manager'
import type { InvitationData } from '@quiet/types'

import { TextField } from '../ui/TextField/TextField'
import { LoadingButton } from '../ui/LoadingButton/LoadingButton'
import { inviteLinkField } from '../../forms/fields/communityFields'
import { InviteLinkErrors } from '../../forms/fieldsErrors'
import { OnboardingBody } from './OnboardingBody'
import { createLogger } from '../../logger'

const logger = createLogger('pasteLink:component')

const PREFIX = 'PasteLinkComponent'

const classes = {
  form: `${PREFIX}form`,
  focus: `${PREFIX}focus`,
  margin: `${PREFIX}margin`,
  error: `${PREFIX}error`,
  button: `${PREFIX}button`,
}

const Form = styled('form')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.space.xl,
  [`& .${classes.focus}`]: {
    '& .MuiOutlinedInput-root': {
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.colors.linkBlue,
      },
    },
  },
  [`& .${classes.margin}`]: {
    '& .MuiFormHelperText-contained': {
      margin: `${theme.space.xs}px 0px`,
    },
  },
  [`& .${classes.error}`]: {
    '& .MuiOutlinedInput-root': {
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.colors.red,
      },
    },
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
}))

interface PasteLinkFormValues {
  name: string
}

export interface PasteLinkComponentProps {
  /** "Paste a link to Join" (invite link), "Join with QR code", "Scan QR code" (device link). */
  heading: string
  intro?: React.ReactNode
  /** Whether the form is mounted; used to reset it when the modal closes. */
  open?: boolean
  isConnectionReady?: boolean
  revealInputValue?: boolean
  handleClickInputReveal?: () => void
  /** Receives the parsed invitation (member or device). */
  handleCommunityAction: (data: InvitationData) => void
}

const field = inviteLinkField()

/**
 * "Paste a link to Join": the WIP frame's intent — heading, one input with
 * placeholder "Link", Continue. Accepts member and device invitations alike;
 * the caller decides what to do with each kind.
 */
export const PasteLinkComponent: React.FC<PasteLinkComponentProps> = ({
  heading,
  intro,
  open = true,
  isConnectionReady = true,
  revealInputValue = false,
  handleClickInputReveal,
  handleCommunityAction,
}) => {
  const {
    handleSubmit,
    formState: { errors },
    setValue,
    setError,
    control,
    clearErrors,
  } = useForm<PasteLinkFormValues>({ mode: 'onTouched' })

  const onSubmit = (values: PasteLinkFormValues) => {
    let data: InvitationData | undefined
    try {
      data = getInvitationCodes(values.name.trim())
    } catch (e) {
      logger.error('Could not parse invitation code', e)
    }
    if (!data) {
      setError('name', { message: InviteLinkErrors.InvalidCode })
      return
    }
    handleCommunityAction(data)
  }

  useEffect(() => {
    if (!open) {
      setValue('name', '')
      clearErrors('name')
    }
  }, [open])

  return (
    <OnboardingBody heading={heading} intro={intro} dataTestId='paste-link'>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Controller
          control={control}
          defaultValue={''}
          rules={field.validation}
          name={'name'}
          render={({ field: controller }) => (
            <TextField
              {...field.fieldProps}
              fullWidth
              classes={classNames({
                [classes.focus]: true,
                [classes.margin]: true,
                [classes.error]: errors.name,
              })}
              placeholder={'Link'}
              errors={errors}
              variant='outlined'
              onchange={event => {
                event.persist()
                setValue('name', event.target.value)
                controller.onChange(event)
              }}
              onblur={() => {}}
              InputProps={{
                endAdornment: (
                  <InputAdornment position='end'>
                    <IconButton size='small' onClick={handleClickInputReveal} data-testid='paste-link-reveal'>
                      {!revealInputValue ? (
                        <VisibilityOff color='primary' fontSize='small' />
                      ) : (
                        <Visibility color='primary' fontSize='small' />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              type={revealInputValue ? 'text' : 'password'}
              value={controller.value.trim()}
              inputProps={{ 'data-testid': 'paste-link-input' }}
              autoFocus
            />
          )}
        />
        <LoadingButton
          type='submit'
          variant='contained'
          size='small'
          color='primary'
          text={'Continue'}
          data-testid={'continue-joinCommunity'}
          classes={{ button: classes.button }}
          disabled={!isConnectionReady}
        />
      </Form>
    </OnboardingBody>
  )
}

export default PasteLinkComponent
